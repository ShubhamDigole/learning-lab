/// <reference lib="webworker" />
// Runs Python off the main thread so an endless loop can never freeze the page.
import { loadPyodide } from 'pyodide'
import { execPython } from './harness.ts'

type Req = { id: number; code: string; files: Record<string, string>; checks: string[] }

const ready = loadPyodide({ indexURL: new URL('/pyodide/', self.location.origin).toString() })

self.onmessage = async (e: MessageEvent<Req | { warm: true }>) => {
  const msg = e.data
  if ('warm' in msg) {
    await ready
    self.postMessage({ warm: true })
    return
  }
  try {
    const py = await ready
    const result = execPython(py as never, msg.code, msg.files, msg.checks)
    self.postMessage({ id: msg.id, result })
  } catch (err) {
    self.postMessage({ id: msg.id, result: { output: '', error: { type: 'LabError', message: String((err as Error)?.message ?? err), line: 0, trace: String(err) }, checks: [] } })
  }
}
