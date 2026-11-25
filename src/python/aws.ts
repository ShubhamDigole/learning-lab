// A small, faithful AWS simulation for the Python lab: `boto3` (S3 client + resource, Lambda invoke),
// `botocore.exceptions`, an in-memory S3 with versioning, lifecycle, policies, encryption settings and
// event notifications, and a Lambda runtime that invokes the learner's handler with real-shaped events,
// writes CloudWatch-style logs, simulates cold/warm starts, timeouts, async retries and loop detection.
// Error codes and messages follow AWS so what she learns carries over.

export const AWS_SHIM = String.raw`
import sys, types, json, io, time, hashlib, datetime, urllib.parse, os, re, traceback, base64, fnmatch, copy

REGION = "ap-south-1"
ACCOUNT = "123456789012"
TAKEN = {"test", "data", "logs", "backup", "my-bucket", "chaicart", "bucket", "images", "kisanmandi"}

class ClientError(Exception):
    def __init__(self, error_response, operation_name):
        self.response = error_response
        self.operation_name = operation_name
        err = error_response.get("Error", {})
        super().__init__("An error occurred (%s) when calling the %s operation: %s" % (err.get("Code"), operation_name, err.get("Message")))

class ParamValidationError(Exception):
    pass

class NoCredentialsError(Exception):
    pass

for _c in (ClientError, ParamValidationError, NoCredentialsError):
    _c.__module__ = "botocore.exceptions"

class _State:
    def __init__(self):
        self.reset({})
    def reset(self, cfg):
        self.buckets = {}
        self.calls = []
        self.clock = datetime.datetime(2026, 11, 24, 2, 0, 0, tzinfo=datetime.timezone.utc)
        self.ver = 0
        self.deny = list(cfg.get("deny", []))
        self.pending = []
        self.invocations = []
        self.ns = None
        self.fn = dict(cfg.get("lambda") or {})
        # Lambda environment variables exist from the start (init code can read them), and never leak between runs.
        for k in getattr(self, "env_keys", []):
            os.environ.pop(k, None)
        self.env_keys = []
        if self.fn:
            env = {str(k): str(v) for k, v in (self.fn.get("env") or {}).items()}
            env.update({"AWS_REGION": REGION, "AWS_LAMBDA_FUNCTION_NAME": self.fn_name(), "AWS_LAMBDA_FUNCTION_MEMORY_SIZE": str(self.fn.get("memoryMb", 128))})
            os.environ.update(env)
            self.env_keys = list(env)
        self.warm = False
        self.req = 0
        self.vclock = 0.0
        self.depth = 0
        self.dlq = []
        for name, objs in (cfg.get("buckets") or {}).items():
            self._new_bucket(name)
            for key, body in objs.items():
                self._put(name, key, body.encode("utf-8") if isinstance(body, str) else body, "text/plain", {}, "STANDARD", seed=True)
        for name, conf in (cfg.get("bucketConfig") or {}).items():
            b = self.buckets.setdefault(name, None) or self._new_bucket(name)
            b = self.buckets[name]
            if conf.get("versioning"):
                b["versioning"] = conf["versioning"]
            if conf.get("notifyPrefix") is not None or conf.get("notifySuffix") is not None:
                b["notifications"] = [{"arn": self.fn_arn(), "events": ["s3:ObjectCreated:*"], "prefix": conf.get("notifyPrefix", ""), "suffix": conf.get("notifySuffix", "")}]
    def fn_name(self):
        return self.fn.get("name", "process-file")
    def fn_arn(self):
        return "arn:aws:lambda:%s:%s:function:%s" % (REGION, ACCOUNT, self.fn_name())
    def tick(self):
        self.clock += datetime.timedelta(seconds=1)
        return self.clock
    def _new_bucket(self, name):
        self.buckets[name] = {"objects": {}, "versioning": None, "lifecycle": None, "policy": None, "public_block": {"BlockPublicAcls": True, "IgnorePublicAcls": True, "BlockPublicPolicy": True, "RestrictPublicBuckets": True}, "encryption": "AES256", "notifications": [], "created": self.tick(), "region": REGION}
        return self.buckets[name]
    def _put(self, bucket, key, body, ctype, meta, sclass, seed=False):
        b = self.buckets[bucket]
        self.ver += 1
        vid = ("v%06d" % self.ver) if b["versioning"] == "Enabled" else "null"
        obj = {"body": body, "etag": '"%s"' % hashlib.md5(body).hexdigest(), "size": len(body), "modified": self.tick(), "ctype": ctype, "meta": dict(meta or {}), "sclass": sclass or "STANDARD", "vid": vid, "marker": False}
        versions = b["objects"].setdefault(key, [])
        if vid == "null":
            versions[:] = [v for v in versions if v["vid"] != "null"]
        versions.append(obj)
        if not seed:
            self.notify(bucket, key, obj, "ObjectCreated:Put")
        return obj
    def latest(self, bucket, key):
        vs = self.buckets[bucket]["objects"].get(key) or []
        if not vs or vs[-1]["marker"]:
            return None
        return vs[-1]
    def notify(self, bucket, key, obj, event):
        for n in self.buckets[bucket]["notifications"]:
            if key.startswith(n.get("prefix", "")) and key.endswith(n.get("suffix", "")):
                self.pending.append((s3_event(bucket, key, obj["size"], obj["etag"].strip('"'), event, self.clock), self.depth + 1))

STATE = _State()

def s3_event(bucket, key, size, etag, event="ObjectCreated:Put", when=None):
    when = when or STATE.clock
    return {"Records": [{
        "eventVersion": "2.1", "eventSource": "aws:s3", "awsRegion": REGION,
        "eventTime": when.strftime("%Y-%m-%dT%H:%M:%S.000Z"), "eventName": event,
        "userIdentity": {"principalId": "AWS:AIDAEXAMPLE"},
        "requestParameters": {"sourceIPAddress": "10.0.0.1"},
        "responseElements": {"x-amz-request-id": "C3D13FE58DE4C810"},
        "s3": {"s3SchemaVersion": "1.0", "configurationId": "on-new-file",
               "bucket": {"name": bucket, "ownerIdentity": {"principalId": "A3NL1KOZZKExample"}, "arn": "arn:aws:s3:::" + bucket},
               "object": {"key": urllib.parse.quote_plus(key, safe="/"), "size": size, "eTag": etag, "sequencer": "0A1B2C3D4E5F678901"}}}]}

def _err(code, msg, op, status=400, extra=None):
    e = {"Error": {"Code": code, "Message": msg}, "ResponseMetadata": {"HTTPStatusCode": status}}
    if extra:
        e["Error"].update(extra)
    raise ClientError(e, op)

def _check_iam(action, op, bucket=None, key=None):
    target = (bucket or "") + ("/" + key if key else "")
    for rule in STATE.deny:
        act, _, res = rule.partition("@")
        if fnmatch.fnmatch(action, act) and (not res or fnmatch.fnmatch(target, res)):
            _err("AccessDenied", "User: arn:aws:sts::%s:assumed-role/%s-role/%s is not authorized to perform: %s on resource: \"arn:aws:s3:::%s\" because no identity-based policy allows the %s action" % (ACCOUNT, STATE.fn_name(), STATE.fn_name(), action, target, action), op, 403)

def _need(params, name, op):
    if name not in params or params[name] is None:
        raise ParamValidationError('Parameter validation failed:\nMissing required parameter in input: "%s"' % name)
    return params[name]

def _bucket(name, op):
    if name not in STATE.buckets:
        _err("NoSuchBucket", "The specified bucket does not exist", op, 404, {"BucketName": name})
    return STATE.buckets[name]

def _valid_name(name):
    return bool(re.fullmatch(r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]", name)) and ".." not in name and not re.fullmatch(r"\d+\.\d+\.\d+\.\d+", name)

class StreamingBody:
    def __init__(self, data):
        self._io = io.BytesIO(data)
        self._len = len(data)
    def read(self, amt=None):
        return self._io.read() if amt is None else self._io.read(amt)
    def iter_lines(self, chunk_size=1024, keepends=False):
        for line in self._io.read().splitlines(keepends):
            yield line
    def iter_chunks(self, chunk_size=1024):
        while True:
            c = self._io.read(chunk_size)
            if not c:
                break
            yield c
    def close(self):
        pass
    def __repr__(self):
        return "<botocore.response.StreamingBody object>"

def _to_bytes(body):
    if body is None:
        return b""
    if isinstance(body, bytes):
        return body
    if isinstance(body, str):
        return body.encode("utf-8")
    if hasattr(body, "read"):
        d = body.read()
        return d.encode("utf-8") if isinstance(d, str) else d
    raise ParamValidationError("Parameter validation failed:\nInvalid type for parameter Body, value: %r, type: %s, valid types: bytes, bytearray, file-like object" % (body, type(body).__name__))

def _meta(op, status=200):
    return {"RequestId": "4442587FB7D0A2F9", "HTTPStatusCode": status, "RetryAttempts": 0}

class S3Client:
    def __init__(self, region_name=None, **kw):
        self.region = region_name or os.environ.get("AWS_DEFAULT_REGION", REGION)
        self.meta = types.SimpleNamespace(region_name=self.region)
        self.exceptions = types.SimpleNamespace(NoSuchKey=ClientError, NoSuchBucket=ClientError, BucketAlreadyExists=ClientError, BucketAlreadyOwnedByYou=ClientError, ClientError=ClientError)
    def _log(self, op, detail=""):
        STATE.calls.append(op + (" " + detail if detail else ""))
    # ----- buckets -----
    def create_bucket(self, **p):
        op = "CreateBucket"
        name = _need(p, "Bucket", op)
        self._log(op, name)
        _check_iam("s3:CreateBucket", op, name)
        if not _valid_name(name):
            _err("InvalidBucketName", "The specified bucket is not valid.", op, 400, {"BucketName": name})
        if name in STATE.buckets:
            _err("BucketAlreadyOwnedByYou", "Your previous request to create the named bucket succeeded and you already own it.", op, 409, {"BucketName": name})
        if name in TAKEN:
            _err("BucketAlreadyExists", "The requested bucket name is not available. The bucket namespace is shared by all users of the system. Please select a different name and try again.", op, 409, {"BucketName": name})
        loc = (p.get("CreateBucketConfiguration") or {}).get("LocationConstraint")
        if self.region != "us-east-1" and loc is None:
            _err("IllegalLocationConstraintException", "The unspecified location constraint is incompatible for the region specific endpoint this request was sent to.", op, 400)
        if loc is not None and loc != self.region:
            _err("IllegalLocationConstraintException", "The %s location constraint is incompatible for the region specific endpoint this request was sent to." % loc, op, 400)
        b = STATE._new_bucket(name)
        b["region"] = loc or "us-east-1"
        return {"Location": "http://%s.s3.amazonaws.com/" % name, "ResponseMetadata": _meta(op)}
    def list_buckets(self, **p):
        self._log("ListBuckets")
        _check_iam("s3:ListAllMyBuckets", "ListBuckets")
        return {"Buckets": [{"Name": n, "CreationDate": b["created"]} for n, b in sorted(STATE.buckets.items())], "Owner": {"DisplayName": "chaicart-data", "ID": "a1b2c3"}, "ResponseMetadata": _meta("ListBuckets")}
    def head_bucket(self, **p):
        name = _need(p, "Bucket", "HeadBucket")
        self._log("HeadBucket", name)
        if name not in STATE.buckets:
            _err("404", "Not Found", "HeadBucket", 404)
        return {"BucketRegion": STATE.buckets[name]["region"], "ResponseMetadata": _meta("HeadBucket")}
    def delete_bucket(self, **p):
        op = "DeleteBucket"
        name = _need(p, "Bucket", op)
        self._log(op, name)
        b = _bucket(name, op)
        if any(b["objects"].values()):
            _err("BucketNotEmpty", "The bucket you tried to delete is not empty", op, 409, {"BucketName": name})
        del STATE.buckets[name]
        return {"ResponseMetadata": _meta(op, 204)}
    # ----- objects -----
    def put_object(self, **p):
        op = "PutObject"
        bucket = _need(p, "Bucket", op)
        key = _need(p, "Key", op)
        self._log(op, bucket + "/" + key)
        _check_iam("s3:PutObject", op, bucket, key)
        _bucket(bucket, op)
        sc = p.get("StorageClass", "STANDARD")
        if sc not in ("STANDARD", "STANDARD_IA", "ONEZONE_IA", "INTELLIGENT_TIERING", "GLACIER", "GLACIER_IR", "DEEP_ARCHIVE", "REDUCED_REDUNDANCY", "EXPRESS_ONEZONE"):
            _err("InvalidStorageClass", "The storage class you specified is not valid", op, 400)
        obj = STATE._put(bucket, key, _to_bytes(p.get("Body")), p.get("ContentType", "binary/octet-stream"), p.get("Metadata"), sc)
        out = {"ETag": obj["etag"], "ServerSideEncryption": p.get("ServerSideEncryption", STATE.buckets[bucket]["encryption"]), "ResponseMetadata": _meta(op)}
        if obj["vid"] != "null":
            out["VersionId"] = obj["vid"]
        return out
    def _get(self, op, p):
        bucket = _need(p, "Bucket", op)
        key = _need(p, "Key", op)
        self._log(op, bucket + "/" + key)
        _check_iam("s3:GetObject", op, bucket, key)
        b = _bucket(bucket, op)
        vid = p.get("VersionId")
        if vid:
            matches = [v for v in b["objects"].get(key, []) if v["vid"] == vid]
            if not matches:
                _err("NoSuchVersion", "The specified version does not exist.", op, 404, {"Key": key, "VersionId": vid})
            obj = matches[0]
            if obj["marker"]:
                _err("MethodNotAllowed", "The specified method is not allowed against this resource.", op, 405)
        else:
            obj = STATE.latest(bucket, key)
        if obj is None:
            if op == "HeadObject":
                _err("404", "Not Found", op, 404)
            _err("NoSuchKey", "The specified key does not exist.", op, 404, {"Key": key})
        if obj["sclass"] in ("GLACIER", "DEEP_ARCHIVE") and op == "GetObject":
            _err("InvalidObjectState", "The operation is not valid for the object's storage class", op, 403, {"StorageClass": obj["sclass"]})
        return obj
    def get_object(self, **p):
        obj = self._get("GetObject", p)
        data = obj["body"]
        rng = p.get("Range")
        status = 200
        if rng:
            m = re.fullmatch(r"bytes=(\d+)-(\d*)", rng)
            if m:
                a = int(m.group(1))
                z = int(m.group(2)) if m.group(2) else len(data) - 1
                data = data[a:z + 1]
                status = 206
        out = {"Body": StreamingBody(data), "ContentLength": len(data), "ContentType": obj["ctype"], "ETag": obj["etag"], "LastModified": obj["modified"], "Metadata": dict(obj["meta"]), "StorageClass": obj["sclass"], "ResponseMetadata": _meta("GetObject", status)}
        if obj["vid"] != "null":
            out["VersionId"] = obj["vid"]
        return out
    def head_object(self, **p):
        obj = self._get("HeadObject", p)
        out = {"ContentLength": obj["size"], "ContentType": obj["ctype"], "ETag": obj["etag"], "LastModified": obj["modified"], "Metadata": dict(obj["meta"]), "ResponseMetadata": _meta("HeadObject")}
        if obj["sclass"] != "STANDARD":
            out["StorageClass"] = obj["sclass"]
        return out
    def delete_object(self, **p):
        op = "DeleteObject"
        bucket = _need(p, "Bucket", op)
        key = _need(p, "Key", op)
        self._log(op, bucket + "/" + key)
        _check_iam("s3:DeleteObject", op, bucket, key)
        b = _bucket(bucket, op)
        vid = p.get("VersionId")
        versions = b["objects"].get(key, [])
        if vid:
            b["objects"][key] = [v for v in versions if v["vid"] != vid]
            return {"VersionId": vid, "ResponseMetadata": _meta(op, 204)}
        if b["versioning"] in ("Enabled", "Suspended"):
            STATE.ver += 1
            mid = ("v%06d" % STATE.ver) if b["versioning"] == "Enabled" else "null"
            versions.append({"body": b"", "etag": "", "size": 0, "modified": STATE.tick(), "ctype": "", "meta": {}, "sclass": "STANDARD", "vid": mid, "marker": True})
            b["objects"][key] = versions
            return {"DeleteMarker": True, "VersionId": mid, "ResponseMetadata": _meta(op, 204)}
        b["objects"].pop(key, None)
        return {"ResponseMetadata": _meta(op, 204)}
    def delete_objects(self, **p):
        op = "DeleteObjects"
        bucket = _need(p, "Bucket", op)
        objs = _need(p, "Delete", op).get("Objects", [])
        if len(objs) > 1000:
            _err("MalformedXML", "The XML you provided was not well-formed or did not validate against our published schema", op, 400)
        deleted = []
        for o in objs:
            self.delete_object(Bucket=bucket, Key=o["Key"])
            deleted.append({"Key": o["Key"]})
        return {"Deleted": deleted, "ResponseMetadata": _meta(op)}
    def copy_object(self, **p):
        op = "CopyObject"
        bucket = _need(p, "Bucket", op)
        key = _need(p, "Key", op)
        src = _need(p, "CopySource", op)
        if isinstance(src, str):
            sb, _, sk = src.lstrip("/").partition("/")
            src = {"Bucket": sb, "Key": urllib.parse.unquote(sk)}
        self._log(op, "%s/%s -> %s/%s" % (src["Bucket"], src["Key"], bucket, key))
        obj = self._get("GetObject", {"Bucket": src["Bucket"], "Key": src["Key"], "VersionId": src.get("VersionId")})
        _check_iam("s3:PutObject", op, bucket, key)
        _bucket(bucket, op)
        new = STATE._put(bucket, key, obj["body"], obj["ctype"], obj["meta"] if p.get("MetadataDirective") != "REPLACE" else p.get("Metadata"), p.get("StorageClass", obj["sclass"]))
        return {"CopyObjectResult": {"ETag": new["etag"], "LastModified": new["modified"]}, "ResponseMetadata": _meta(op)}
    def list_objects_v2(self, **p):
        op = "ListObjectsV2"
        bucket = _need(p, "Bucket", op)
        prefix = p.get("Prefix", "")
        delim = p.get("Delimiter")
        maxk = int(p.get("MaxKeys", 1000))
        self._log(op, bucket + ("/" + prefix if prefix else "") + (" (delimiter %r)" % delim if delim else ""))
        _check_iam("s3:ListBucket", op, bucket)
        b = _bucket(bucket, op)
        keys = sorted(k for k in b["objects"] if STATE.latest(bucket, k) is not None and k.startswith(prefix))
        start = p.get("ContinuationToken")
        if start:
            try:
                start = base64.b64decode(start.encode()).decode()
            except Exception:
                _err("InvalidArgument", "The continuation token provided is incorrect", op, 400)
            keys = [k for k in keys if k > start]
        if p.get("StartAfter"):
            keys = [k for k in keys if k > p["StartAfter"]]
        contents, prefixes, last = [], [], None
        for k in keys:
            if len(contents) + len(prefixes) >= maxk:
                break
            if delim:
                rest = k[len(prefix):]
                if delim in rest:
                    cp = prefix + rest.split(delim)[0] + delim
                    if cp not in prefixes:
                        prefixes.append(cp)
                    last = k
                    continue
            o = STATE.latest(bucket, k)
            contents.append({"Key": k, "LastModified": o["modified"], "ETag": o["etag"], "Size": o["size"], "StorageClass": o["sclass"]})
            last = k
        remaining = [k for k in keys if last is not None and k > last and not (delim and any(k.startswith(c) for c in prefixes))]
        out = {"IsTruncated": bool(remaining), "Name": bucket, "Prefix": prefix, "MaxKeys": maxk, "KeyCount": len(contents) + len(prefixes), "EncodingType": "url", "ResponseMetadata": _meta(op)}
        if contents:
            out["Contents"] = contents
        if prefixes:
            out["CommonPrefixes"] = [{"Prefix": c} for c in prefixes]
        if delim:
            out["Delimiter"] = delim
        if remaining:
            out["NextContinuationToken"] = base64.b64encode(last.encode()).decode()
        return out
    def list_objects(self, **p):
        r = self.list_objects_v2(**p)
        r.pop("KeyCount", None)
        return r
    def list_object_versions(self, **p):
        op = "ListObjectVersions"
        bucket = _need(p, "Bucket", op)
        prefix = p.get("Prefix", "")
        self._log(op, bucket)
        b = _bucket(bucket, op)
        versions, markers = [], []
        for k in sorted(b["objects"]):
            if not k.startswith(prefix):
                continue
            vs = b["objects"][k]
            for i, v in enumerate(reversed(vs)):
                item = {"Key": k, "VersionId": v["vid"], "IsLatest": i == 0, "LastModified": v["modified"]}
                if v["marker"]:
                    markers.append(item)
                else:
                    item.update({"ETag": v["etag"], "Size": v["size"], "StorageClass": v["sclass"]})
                    versions.append(item)
        out = {"Name": bucket, "Prefix": prefix, "IsTruncated": False, "ResponseMetadata": _meta(op)}
        if versions:
            out["Versions"] = versions
        if markers:
            out["DeleteMarkers"] = markers
        return out
    def upload_file(self, Filename, Bucket, Key, ExtraArgs=None, Callback=None, Config=None):
        with open(Filename, "rb") as f:
            self.put_object(Bucket=Bucket, Key=Key, Body=f.read(), **(ExtraArgs or {}))
    def upload_fileobj(self, Fileobj, Bucket, Key, ExtraArgs=None, Callback=None, Config=None):
        self.put_object(Bucket=Bucket, Key=Key, Body=Fileobj.read(), **(ExtraArgs or {}))
    def download_file(self, Bucket, Key, Filename, ExtraArgs=None, Callback=None, Config=None):
        data = self.get_object(Bucket=Bucket, Key=Key)["Body"].read()
        d = os.path.dirname(Filename)
        if d:
            os.makedirs(d, exist_ok=True)
        with open(Filename, "wb") as f:
            f.write(data)
    def download_fileobj(self, Bucket, Key, Fileobj, ExtraArgs=None, Callback=None, Config=None):
        Fileobj.write(self.get_object(Bucket=Bucket, Key=Key)["Body"].read())
    def generate_presigned_url(self, ClientMethod, Params=None, ExpiresIn=3600, HttpMethod=None):
        Params = Params or {}
        if ExpiresIn > 604800:
            raise ParamValidationError("Presigned URLs can be valid for at most 7 days (604800 seconds).")
        sig = hashlib.sha256(("%s|%s|%s|%s" % (ClientMethod, Params.get("Bucket"), Params.get("Key"), ExpiresIn)).encode()).hexdigest()
        self._log("PresignURL", "%s %s/%s (%ss)" % (ClientMethod, Params.get("Bucket"), Params.get("Key"), ExpiresIn))
        return "https://%s.s3.%s.amazonaws.com/%s?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAEXAMPLE%%2F20261124%%2F%s%%2Fs3%%2Faws4_request&X-Amz-Date=20261124T020000Z&X-Amz-Expires=%d&X-Amz-SignedHeaders=host&X-Amz-Signature=%s" % (Params.get("Bucket"), self.region, urllib.parse.quote(Params.get("Key", "")), self.region, ExpiresIn, sig)
    def get_paginator(self, name):
        if name not in ("list_objects_v2", "list_objects", "list_object_versions"):
            raise ValueError("Operation cannot be paginated: %s" % name)
        client = self
        class _P:
            def paginate(self, **p):
                cfg = p.pop("PaginationConfig", {}) or {}
                page = cfg.get("PageSize", 1000)
                token = None
                while True:
                    args = dict(p, MaxKeys=page)
                    if token:
                        args["ContinuationToken"] = token
                    r = getattr(client, name)(**args)
                    yield r
                    if not r.get("IsTruncated"):
                        break
                    token = r.get("NextContinuationToken")
        return _P()
    # ----- bucket settings -----
    def put_bucket_versioning(self, **p):
        op = "PutBucketVersioning"
        bucket = _need(p, "Bucket", op)
        status = _need(p, "VersioningConfiguration", op).get("Status")
        self._log(op, "%s %s" % (bucket, status))
        b = _bucket(bucket, op)
        if status not in ("Enabled", "Suspended"):
            _err("MalformedXML", "The XML you provided was not well-formed or did not validate against our published schema", op)
        b["versioning"] = status
        return {"ResponseMetadata": _meta(op)}
    def get_bucket_versioning(self, **p):
        b = _bucket(_need(p, "Bucket", "GetBucketVersioning"), "GetBucketVersioning")
        out = {"ResponseMetadata": _meta("GetBucketVersioning")}
        if b["versioning"]:
            out["Status"] = b["versioning"]
        return out
    def put_bucket_lifecycle_configuration(self, **p):
        op = "PutBucketLifecycleConfiguration"
        bucket = _need(p, "Bucket", op)
        rules = _need(p, "LifecycleConfiguration", op).get("Rules", [])
        self._log(op, "%s (%d rules)" % (bucket, len(rules)))
        b = _bucket(bucket, op)
        for r in rules:
            if r.get("Status") not in ("Enabled", "Disabled"):
                _err("MalformedXML", "The XML you provided was not well-formed or did not validate against our published schema", op)
            if not any(k in r for k in ("Transitions", "Expiration", "NoncurrentVersionExpiration", "NoncurrentVersionTransitions", "AbortIncompleteMultipartUpload")):
                _err("InvalidRequest", "At least one action needs to be specified in a rule", op)
            for t in r.get("Transitions", []):
                if t.get("StorageClass") in ("STANDARD_IA", "ONEZONE_IA") and t.get("Days", 30) < 30:
                    _err("InvalidArgument", "'Days' in Transition action must be greater than or equal to 30 for storageClass '%s'" % t["StorageClass"], op)
        b["lifecycle"] = copy.deepcopy(rules)
        return {"ResponseMetadata": _meta(op)}
    def get_bucket_lifecycle_configuration(self, **p):
        op = "GetBucketLifecycleConfiguration"
        b = _bucket(_need(p, "Bucket", op), op)
        if not b["lifecycle"]:
            _err("NoSuchLifecycleConfiguration", "The lifecycle configuration does not exist", op, 404)
        return {"Rules": copy.deepcopy(b["lifecycle"]), "ResponseMetadata": _meta(op)}
    def put_bucket_policy(self, **p):
        op = "PutBucketPolicy"
        bucket = _need(p, "Bucket", op)
        text = _need(p, "Policy", op)
        self._log(op, bucket)
        b = _bucket(bucket, op)
        try:
            pol = json.loads(text)
        except Exception:
            _err("MalformedPolicy", "Policies must be valid JSON and the first byte must be '{'", op)
        sts = pol.get("Statement")
        if not isinstance(sts, list) or not sts:
            _err("MalformedPolicy", "Missing required field Statement", op)
        for st in sts:
            for f in ("Effect", "Principal", "Action", "Resource"):
                if f not in st:
                    _err("MalformedPolicy", "Missing required field %s" % f, op)
            if st["Effect"] not in ("Allow", "Deny"):
                _err("MalformedPolicy", "Invalid effect: %s" % st["Effect"], op)
            res = st["Resource"] if isinstance(st["Resource"], list) else [st["Resource"]]
            for r in res:
                if not r.startswith("arn:aws:s3:::" + bucket):
                    _err("MalformedPolicy", "Policy has invalid resource", op)
            if st["Effect"] == "Allow" and st["Principal"] in ("*", {"AWS": "*"}) and b["public_block"].get("BlockPublicPolicy"):
                _err("AccessDenied", "User is not authorized to perform: s3:PutBucketPolicy on resource because public policies are blocked by the BlockPublicPolicy block public access setting.", op, 403)
        b["policy"] = text
        return {"ResponseMetadata": _meta(op, 204)}
    def get_bucket_policy(self, **p):
        op = "GetBucketPolicy"
        b = _bucket(_need(p, "Bucket", op), op)
        if not b["policy"]:
            _err("NoSuchBucketPolicy", "The bucket policy does not exist", op, 404)
        return {"Policy": b["policy"], "ResponseMetadata": _meta(op)}
    def put_public_access_block(self, **p):
        op = "PutPublicAccessBlock"
        b = _bucket(_need(p, "Bucket", op), op)
        b["public_block"] = dict(_need(p, "PublicAccessBlockConfiguration", op))
        self._log(op, p["Bucket"])
        return {"ResponseMetadata": _meta(op)}
    def get_public_access_block(self, **p):
        b = _bucket(_need(p, "Bucket", "GetPublicAccessBlock"), "GetPublicAccessBlock")
        return {"PublicAccessBlockConfiguration": dict(b["public_block"]), "ResponseMetadata": _meta("GetPublicAccessBlock")}
    def put_bucket_encryption(self, **p):
        op = "PutBucketEncryption"
        b = _bucket(_need(p, "Bucket", op), op)
        rule = _need(p, "ServerSideEncryptionConfiguration", op)["Rules"][0]["ApplyServerSideEncryptionByDefault"]
        b["encryption"] = rule["SSEAlgorithm"]
        if rule.get("KMSMasterKeyID"):
            b["kms_key"] = rule["KMSMasterKeyID"]
        self._log(op, "%s %s" % (p["Bucket"], b["encryption"]))
        return {"ResponseMetadata": _meta(op)}
    def get_bucket_encryption(self, **p):
        b = _bucket(_need(p, "Bucket", "GetBucketEncryption"), "GetBucketEncryption")
        algo = {"SSEAlgorithm": b["encryption"]}
        if b.get("kms_key"):
            algo["KMSMasterKeyID"] = b["kms_key"]
        return {"ServerSideEncryptionConfiguration": {"Rules": [{"ApplyServerSideEncryptionByDefault": algo, "BucketKeyEnabled": b["encryption"] == "aws:kms"}]}, "ResponseMetadata": _meta("GetBucketEncryption")}
    def put_bucket_notification_configuration(self, **p):
        op = "PutBucketNotificationConfiguration"
        bucket = _need(p, "Bucket", op)
        conf = _need(p, "NotificationConfiguration", op)
        b = _bucket(bucket, op)
        out = []
        for c in conf.get("LambdaFunctionConfigurations", []):
            prefix = suffix = ""
            for r in ((c.get("Filter") or {}).get("Key") or {}).get("FilterRules", []):
                if r["Name"].lower() == "prefix":
                    prefix = r["Value"]
                if r["Name"].lower() == "suffix":
                    suffix = r["Value"]
            out.append({"arn": c["LambdaFunctionArn"], "events": c.get("Events", []), "prefix": prefix, "suffix": suffix})
        b["notifications"] = out
        self._log(op, "%s (%d Lambda triggers)" % (bucket, len(out)))
        return {"ResponseMetadata": _meta(op)}
    def get_bucket_notification_configuration(self, **p):
        b = _bucket(_need(p, "Bucket", "GetBucketNotificationConfiguration"), "GetBucketNotificationConfiguration")
        return {"LambdaFunctionConfigurations": [{"LambdaFunctionArn": n["arn"], "Events": n["events"], "Filter": {"Key": {"FilterRules": [{"Name": "Prefix", "Value": n["prefix"]}, {"Name": "Suffix", "Value": n["suffix"]}]}}} for n in b["notifications"]]}

# ----- resource API (the friendlier object style) -----
class _ObjectSummary:
    def __init__(self, client, bucket, key):
        self._c, self.bucket_name, self.key = client, bucket, key
        o = STATE.latest(bucket, key)
        self.size, self.last_modified, self.e_tag, self.storage_class = o["size"], o["modified"], o["etag"], o["sclass"]
    def get(self, **kw):
        return self._c.get_object(Bucket=self.bucket_name, Key=self.key, **kw)
    def delete(self):
        return self._c.delete_object(Bucket=self.bucket_name, Key=self.key)
    def __repr__(self):
        return "s3.ObjectSummary(bucket_name='%s', key='%s')" % (self.bucket_name, self.key)

class _Objects:
    def __init__(self, client, bucket):
        self._c, self._b = client, bucket
    def filter(self, Prefix="", **kw):
        for page in self._c.get_paginator("list_objects_v2").paginate(Bucket=self._b, Prefix=Prefix):
            for o in page.get("Contents", []):
                yield _ObjectSummary(self._c, self._b, o["Key"])
    def all(self):
        return self.filter()

class _Bucket:
    def __init__(self, client, name):
        self._c, self.name = client, name
        self.objects = _Objects(client, name)
    def put_object(self, Key, Body=b"", **kw):
        self._c.put_object(Bucket=self.name, Key=Key, Body=Body, **kw)
        return _Object(self._c, self.name, Key)
    def upload_file(self, Filename, Key, **kw):
        return self._c.upload_file(Filename, self.name, Key)
    def download_file(self, Key, Filename, **kw):
        return self._c.download_file(self.name, Key, Filename)
    def Object(self, key):
        return _Object(self._c, self.name, key)
    def __repr__(self):
        return "s3.Bucket(name='%s')" % self.name

class _Object:
    def __init__(self, client, bucket, key):
        self._c, self.bucket_name, self.key = client, bucket, key
    def get(self, **kw):
        return self._c.get_object(Bucket=self.bucket_name, Key=self.key, **kw)
    def put(self, Body=b"", **kw):
        return self._c.put_object(Bucket=self.bucket_name, Key=self.key, Body=Body, **kw)
    def delete(self):
        return self._c.delete_object(Bucket=self.bucket_name, Key=self.key)
    def copy_from(self, CopySource, **kw):
        return self._c.copy_object(Bucket=self.bucket_name, Key=self.key, CopySource=CopySource, **kw)
    def __repr__(self):
        return "s3.Object(bucket_name='%s', key='%s')" % (self.bucket_name, self.key)

class S3Resource:
    def __init__(self, region_name=None, **kw):
        self.meta = types.SimpleNamespace(client=S3Client(region_name))
    def Bucket(self, name):
        return _Bucket(self.meta.client, name)
    def Object(self, bucket, key):
        return _Object(self.meta.client, bucket, key)
    @property
    def buckets(self):
        c = self.meta.client
        return types.SimpleNamespace(all=lambda: [_Bucket(c, b["Name"]) for b in c.list_buckets()["Buckets"]])

# ----- Lambda -----
class LambdaClient:
    def __init__(self, region_name=None, **kw):
        self.meta = types.SimpleNamespace(region_name=region_name or REGION)
    def invoke(self, FunctionName, Payload=b"{}", InvocationType="RequestResponse", **kw):
        STATE.calls.append("Lambda.Invoke %s (%s)" % (FunctionName, InvocationType))
        name = FunctionName.split(":")[-1]
        if name != STATE.fn_name():
            _err("ResourceNotFoundException", "Function not found: arn:aws:lambda:%s:%s:function:%s" % (REGION, ACCOUNT, name), "Invoke", 404)
        event = json.loads(Payload.decode() if isinstance(Payload, bytes) else (Payload or "{}"))
        if InvocationType == "Event":
            STATE.pending.append((event, STATE.depth + 1))
            return {"StatusCode": 202, "Payload": StreamingBody(b"")}
        inv = _invoke(event, "invoke")
        if inv["error"]:
            return {"StatusCode": 200, "FunctionError": "Unhandled", "Payload": StreamingBody(json.dumps(inv["error"]).encode())}
        return {"StatusCode": 200, "Payload": StreamingBody(json.dumps(inv["result"]).encode())}

class _Context:
    def __init__(self, req_id, start, timeout):
        self.function_name = STATE.fn_name()
        self.function_version = "$LATEST"
        self.invoked_function_arn = STATE.fn_arn()
        self.memory_limit_in_mb = int(STATE.fn.get("memoryMb", 128))
        self.aws_request_id = req_id
        self.log_group_name = "/aws/lambda/" + STATE.fn_name()
        self.log_stream_name = "2026/11/24/[$LATEST]4f7c1d2e8a9b4c3d"
        self._start = start
        self._timeout = timeout
    def get_remaining_time_in_millis(self):
        used = (time.perf_counter() - self._start) * 1000 + STATE.vclock * 1000
        return max(0, int(self._timeout * 1000 - used))

class _MarshalError(Exception):
    pass
_MarshalError.__name__ = "Runtime.MarshalError"


def _invoke(event, source, attempt=1):
    import builtins
    STATE.req += 1
    rid = "%08x-%04x-4%03x-a%03x-%012x" % (0x7f3a0000 + STATE.req, STATE.req, STATE.req, STATE.req, 0x9b1c00000000 + STATE.req)
    timeout = float(STATE.fn.get("timeoutSec", 3))
    handler_name = STATE.fn.get("handler", "lambda_handler")
    logs = []
    if not STATE.warm:
        logs.append("INIT_START Runtime Version: python:3.12.v40 Runtime Version ARN: arn:aws:lambda:%s::runtime:2f1e9c" % REGION)
    logs.append("START RequestId: %s Version: $LATEST" % rid)
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    STATE.vclock = 0.0
    real_sleep = time.sleep
    time.sleep = lambda s: setattr(STATE, "vclock", STATE.vclock + float(s))
    start = time.perf_counter()
    result, error = None, None
    try:
        fn = (STATE.ns or {}).get(handler_name)
        if not callable(fn):
            raise RuntimeError("Handler '%s' missing on module 'lambda_function'" % handler_name)
        result = fn(copy.deepcopy(event), _Context(rid, start, timeout))
        try:
            json.dumps(result)
        except (TypeError, ValueError) as je:
            raise _MarshalError("Unable to marshal response: %s" % je)
    except BaseException as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == "main.py"]
        error = {"errorMessage": str(e), "errorType": type(e).__name__, "requestId": rid, "stackTrace": ["  File \"/var/task/lambda_function.py\", line %d, in %s\n    %s\n" % (f.lineno, f.name, (f.line or "").strip()) for f in frames]}
    finally:
        sys.stdout = old
        time.sleep = real_sleep
    dur = (time.perf_counter() - start) * 1000 + STATE.vclock * 1000
    for line in buf.getvalue().splitlines():
        logs.append(line)
    if error is None and dur > timeout * 1000:
        error = {"errorMessage": "%s Task timed out after %.2f seconds" % (rid, timeout), "errorType": "Sandbox.Timedout", "requestId": rid, "stackTrace": []}
        logs.append("%s Task timed out after %.2f seconds" % (time.strftime("2026-11-24T02:00:%S.000Z"), timeout))
        dur = timeout * 1000
    elif error:
        logs.append("[ERROR] %s: %s" % (error["errorType"], error["errorMessage"]))
        logs.append("Traceback (most recent call last):")
        logs.extend(s.rstrip("\n") for s in error["stackTrace"])
    logs.append("END RequestId: %s" % rid)
    mem = int(STATE.fn.get("memoryMb", 128))
    used = min(mem, 38 + len(json.dumps(event, default=str)) // 20000)
    billed = max(1, int(-(-dur // 1))) + (int(-(-(180 + int(STATE.fn.get("memoryMb", 128)) * 0.05) // 1)) if not STATE.warm else 0)
    report = "REPORT RequestId: %s\tDuration: %.2f ms\tBilled Duration: %d ms\tMemory Size: %d MB\tMax Memory Used: %d MB" % (rid, dur, billed, mem, used)
    if not STATE.warm:
        report += "\tInit Duration: %.2f ms" % (180 + mem * 0.05)
    logs.append(report)
    inv = {"requestId": rid, "source": source, "attempt": attempt, "event": event, "result": result, "error": error, "ok": error is None, "logs": logs, "durationMs": round(dur, 2), "billedMs": billed, "memoryMb": mem, "cold": not STATE.warm}
    STATE.warm = True
    STATE.invocations.append(inv)
    return inv

def run_lambda():
    """After the learner's file runs: invoke explicit test events, then S3-triggered events (async: 2 retries)."""
    cfg = STATE.fn
    if not cfg:
        return
    for ev in cfg.get("events") or []:
        _invoke(ev, "test")
    while STATE.pending:
        ev, depth = STATE.pending.pop(0)
        if depth > 16 or len(STATE.invocations) >= 200:
            STATE.invocations.append({"requestId": "-", "source": "loop-detection", "attempt": 0, "event": None, "result": None, "ok": False, "error": {"errorType": "RecursiveInvocationDetected", "errorMessage": "Lambda detected that this function is part of a recursive loop (it writes to the bucket that triggers it) and stopped invoking it after 16 times."}, "logs": ["Lambda stopped a recursive loop: the function keeps writing files that trigger itself again."], "durationMs": 0, "billedMs": 0, "memoryMb": 0, "cold": False})
            STATE.pending.clear()
            break
        retries = int(cfg.get("retries", 2))
        for attempt in range(1, retries + 2):
            STATE.depth = depth
            inv = _invoke(ev, "s3" if "Records" in ev else "async", attempt)
            STATE.depth = 0
            if inv["ok"]:
                break
        else:
            dest = cfg.get("onFailure")
            if dest:
                STATE.invocations[-1]["logs"].append("Event sent to on-failure destination %s after %d attempts" % (dest, retries + 1))
                STATE.dlq.append(ev)
            else:
                STATE.invocations[-1]["logs"].append("Event dropped after %d attempts (no dead-letter queue or on-failure destination)" % (retries + 1))

def snapshot():
    buckets = {}
    for name, b in sorted(STATE.buckets.items()):
        objs = []
        for k in sorted(b["objects"]):
            vs = b["objects"][k]
            if not vs:
                continue
            last = vs[-1]
            objs.append({"key": k, "size": last["size"], "storageClass": last["sclass"], "versions": len([v for v in vs if not v["marker"]]), "deleted": last["marker"], "modified": last["modified"].isoformat()})
        buckets[name] = {"objects": objs, "versioning": b["versioning"] or "Off", "encryption": b["encryption"], "publicBlocked": all(b["public_block"].values()), "lifecycleRules": len(b["lifecycle"] or []), "policy": bool(b["policy"]), "triggers": ["%s%s* -> %s" % (n["prefix"], ("*" + n["suffix"]) if n["suffix"] else "", n["arn"].split(":")[-1]) for n in b["notifications"]]}
    return {"buckets": buckets, "calls": STATE.calls[-200:], "invocations": [{k: v for k, v in i.items() if k != "event"} for i in STATE.invocations], "dlq": len(STATE.dlq)}

# ----- helpers available to hidden checks -----
def s3_keys(bucket, prefix=""):
    b = STATE.buckets.get(bucket)
    return sorted(k for k in (b or {"objects": {}})["objects"] if k.startswith(prefix) and STATE.latest(bucket, k) is not None)
def s3_text(bucket, key):
    o = STATE.latest(bucket, key)
    return None if o is None else o["body"].decode("utf-8")
def s3_exists(bucket, key):
    return bucket in STATE.buckets and STATE.latest(bucket, key) is not None
def s3_versions(bucket, key):
    return len([v for v in STATE.buckets.get(bucket, {"objects": {}})["objects"].get(key, []) if not v["marker"]])
def s3_bucket(bucket):
    return STATE.buckets.get(bucket)
def storage_class_after(bucket, key, days):
    b = STATE.buckets[bucket]
    cls = STATE.latest(bucket, key)["sclass"]
    for r in b["lifecycle"] or []:
        if r.get("Status") != "Enabled":
            continue
        flt = r.get("Filter") or {}
        pre = r.get("Prefix", flt.get("Prefix", (flt.get("And") or {}).get("Prefix", "")))
        if not key.startswith(pre):
            continue
        for t in sorted(r.get("Transitions", []), key=lambda t: t.get("Days", 0)):
            if days >= t.get("Days", 0):
                cls = t["StorageClass"]
        exp = (r.get("Expiration") or {}).get("Days")
        if exp is not None and days >= exp:
            return "EXPIRED"
    return cls

def install():
    boto3 = types.ModuleType("boto3")
    def client(service, region_name=None, **kw):
        if service == "s3":
            return S3Client(region_name)
        if service == "lambda":
            return LambdaClient(region_name)
        raise ValueError("This practice lab simulates the 's3' and 'lambda' services only (asked for '%s')." % service)
    def resource(service, region_name=None, **kw):
        if service == "s3":
            return S3Resource(region_name)
        raise ValueError("This practice lab has a resource API for 's3' only.")
    class Session:
        def __init__(self, region_name=None, profile_name=None, **kw):
            self.region_name = region_name or REGION
        def client(self, service, **kw):
            return client(service, kw.get("region_name", self.region_name))
        def resource(self, service, **kw):
            return resource(service, kw.get("region_name", self.region_name))
    boto3.client, boto3.resource, boto3.Session = client, resource, Session
    boto3.__version__ = "1.35.0"
    botocore = types.ModuleType("botocore")
    exc = types.ModuleType("botocore.exceptions")
    exc.ClientError, exc.ParamValidationError, exc.NoCredentialsError = ClientError, ParamValidationError, NoCredentialsError
    botocore.exceptions = exc
    resp = types.ModuleType("botocore.response")
    resp.StreamingBody = StreamingBody
    botocore.response = resp
    sys.modules["boto3"] = boto3
    sys.modules["botocore"] = botocore
    sys.modules["botocore.exceptions"] = exc
    sys.modules["botocore.response"] = resp
    os.environ.setdefault("AWS_DEFAULT_REGION", REGION)

STATE.dlq = []
`
