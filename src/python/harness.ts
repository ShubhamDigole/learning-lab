// Runs learner Python inside Pyodide: a fresh namespace each run, printed output captured, tracebacks
// trimmed to the learner's own file (main.py), virtual data files written to ./data, and hidden checks
// (Python expressions) evaluated afterwards in the same namespace.
// Shared by the browser worker and the Node content checker.
import { AWS_SHIM } from './aws.ts'

export interface PyError {
  type: string
  message: string
  line: number
  trace: string
}
export interface AwsSnapshot {
  buckets: Record<string, { objects: { key: string; size: number; storageClass: string; versions: number; deleted: boolean; modified: string }[]; versioning: string; encryption: string; publicBlocked: boolean; lifecycleRules: number; policy: boolean; triggers: string[] }>
  calls: string[]
  invocations: { requestId: string; source: string; attempt: number; result: unknown; error: { errorType: string; errorMessage: string; stackTrace?: string[] } | null; ok: boolean; logs: string[]; durationMs: number; billedMs: number; memoryMb: number; cold: boolean }[]
  dlq: number
}
export interface PyRun {
  aws?: AwsSnapshot
  output: string
  error: PyError | null
  checks: { ok: boolean; error?: string }[]
  /** set when the browser stopped a run that took too long */
  timedOut?: boolean
}

// Python source. No backslash escapes on purpose (it lives in a JS string): chr(10) is a newline.
export const HARNESS = `
import sys, io, json, os, traceback, linecache, builtins, shutil

def _qq_no_input(*a, **k):
    raise RuntimeError("input() is not available in this lab. Put the value in a variable instead.")

class _QQCap(io.StringIO):
    def write(self, s):
        if self.tell() > 200000:
            raise RuntimeError("Too much output: is a loop printing forever?")
        return super().write(s)

def _qq_run(code, files_json, checks_json, aws_json="null"):
    import _qq_aws
    files = json.loads(files_json)
    checks = json.loads(checks_json)
    aws = json.loads(aws_json)
    _qq_aws.STATE.reset(aws or {})
    _qq_aws.STATE.dlq = []
    home = "/home/pyodide/work"
    os.chdir("/home/pyodide")
    if os.path.isdir(home):
        shutil.rmtree(home)
    os.makedirs(home)
    os.chdir(home)
    for name, text in files.items():
        path = os.path.join(home, name)
        os.makedirs(os.path.dirname(path) or home, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
    linecache.cache["main.py"] = (len(code), None, code.splitlines(True), "main.py")
    out = _QQCap()
    ns = {"__name__": "__main__", "__builtins__": builtins}
    old = (sys.stdout, sys.stderr, builtins.input)
    sys.stdout = sys.stderr = out
    builtins.input = _qq_no_input
    err = None
    _qq_aws.STATE.ns = ns
    try:
        exec(compile(code, "main.py", "exec"), ns)
    except SystemExit:
        pass
    except BaseException as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == "main.py"]
        line = frames[-1].lineno if frames else 0
        if isinstance(e, SyntaxError) and e.filename == "main.py":
            line = e.lineno or 0
        only = "".join(traceback.format_exception_only(type(e), e)).strip()
        trace = ""
        if frames:
            trace = "Traceback (most recent call last):" + chr(10) + "".join(traceback.format_list(frames))
        trace += only
        err = {"type": type(e).__name__, "message": only.splitlines()[-1] if only else type(e).__name__, "line": line or 0, "trace": trace}
    finally:
        sys.stdout, sys.stderr, builtins.input = old
    if err is None and aws:
        try:
            _qq_aws.run_lambda()
        except BaseException as e:
            err = {"type": "LabError", "message": "The Lambda simulation failed: " + repr(e), "line": 0, "trace": traceback.format_exc()}
    results = []
    if err is None:
        cns = dict(ns)
        st = _qq_aws.STATE
        cns.update({"s3_keys": _qq_aws.s3_keys, "s3_text": _qq_aws.s3_text, "s3_exists": _qq_aws.s3_exists, "s3_versions": _qq_aws.s3_versions, "s3_bucket": _qq_aws.s3_bucket, "storage_class_after": _qq_aws.storage_class_after, "lambda_invocations": st.invocations, "api_calls": st.calls, "dlq_events": st.dlq, "s3_event": _qq_aws.s3_event})
        for c in checks:
            try:
                results.append({"ok": bool(eval(c, cns))})
            except BaseException as e:
                results.append({"ok": False, "error": type(e).__name__ + ": " + str(e)})
    payload = {"output": out.getvalue(), "error": err, "checks": results}
    if aws or _qq_aws.STATE.calls or _qq_aws.STATE.invocations:
        payload["aws"] = _qq_aws.snapshot()
    return json.dumps(payload, default=str)
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pyodide = { runPython: (code: string) => any; globals: { get: (name: string) => any; set: (name: string, v: unknown) => void } }

/** Lab configuration for the simulated AWS account (see aws.ts). */
export interface AwsConfig {
  buckets?: Record<string, Record<string, string>>
  bucketConfig?: Record<string, { versioning?: 'Enabled' | 'Suspended'; notifyPrefix?: string; notifySuffix?: string }>
  deny?: string[]
  lambda?: { name?: string; handler?: string; timeoutSec?: number; memoryMb?: number; env?: Record<string, string>; events?: unknown[]; retries?: number; onFailure?: string }
}

let installed = new WeakSet<object>()
/** Run one program. `files` become ./data/... style paths relative to the working folder. */
export function execPython(py: Pyodide, code: string, files: Record<string, string> = {}, checks: string[] = [], aws: AwsConfig | null = null): PyRun {
  if (!installed.has(py)) {
    py.globals.set('_qq_aws_src', AWS_SHIM)
    py.runPython("import types, sys\n_m = types.ModuleType('_qq_aws')\nexec(compile(_qq_aws_src, '_qq_aws', 'exec'), _m.__dict__)\nsys.modules['_qq_aws'] = _m\n_m.install()")
    py.runPython(HARNESS)
    installed.add(py)
  }
  const run = py.globals.get('_qq_run')
  const json = run(code, JSON.stringify(files), JSON.stringify(checks), JSON.stringify(aws)) as string
  return JSON.parse(json) as PyRun
}
export function resetHarnessCache() {
  installed = new WeakSet<object>()
}
