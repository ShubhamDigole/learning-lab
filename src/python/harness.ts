// Runs learner Python inside Pyodide: a fresh namespace each run, printed output captured, tracebacks
// trimmed to the learner's own file (main.py), virtual data files written to ./data, and hidden checks
// (Python expressions) evaluated afterwards in the same namespace.
// Shared by the browser worker and the Node content checker.

export interface PyError {
  type: string
  message: string
  line: number
  trace: string
}
export interface PyRun {
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

def _qq_run(code, files_json, checks_json):
    files = json.loads(files_json)
    checks = json.loads(checks_json)
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
    results = []
    if err is None:
        for c in checks:
            try:
                results.append({"ok": bool(eval(c, ns))})
            except BaseException as e:
                results.append({"ok": False, "error": type(e).__name__ + ": " + str(e)})
    return json.dumps({"output": out.getvalue(), "error": err, "checks": results})
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pyodide = { runPython: (code: string) => any; globals: { get: (name: string) => any } }

let installed = new WeakSet<object>()
/** Run one program. `files` become ./data/... style paths relative to the working folder. */
export function execPython(py: Pyodide, code: string, files: Record<string, string> = {}, checks: string[] = []): PyRun {
  if (!installed.has(py)) {
    py.runPython(HARNESS)
    installed.add(py)
  }
  const run = py.globals.get('_qq_run')
  const json = run(code, JSON.stringify(files), JSON.stringify(checks)) as string
  return JSON.parse(json) as PyRun
}
export function resetHarnessCache() {
  installed = new WeakSet<object>()
}
