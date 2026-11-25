// Browser side of the Python lab: one worker, reused between runs, replaced if a run takes too long.
import type { AwsConfig, PyRun } from './harness.ts'

const TIMEOUT_MS = 10000
let worker: Worker | null = null
let readyP: Promise<void> | null = null
let seq = 0

function spawn() {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const w = worker
  readyP = new Promise<void>((resolve) => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.warm) {
        w.removeEventListener('message', onMsg)
        resolve()
      }
    }
    w.addEventListener('message', onMsg)
    w.postMessage({ warm: true })
  })
}

/** Start loading Python early (the first load downloads about 10 MB from this app and takes a few seconds). */
export function warmPython(): Promise<void> {
  if (!worker) spawn()
  return readyP!
}
export function pythonLoaded() {
  return worker !== null
}

export async function runPython(code: string, files: Record<string, string> = {}, checks: string[] = [], aws: AwsConfig | null = null): Promise<PyRun> {
  await warmPython()
  const w = worker!
  const id = ++seq
  return new Promise<PyRun>((resolve) => {
    const timer = setTimeout(() => {
      w.removeEventListener('message', onMsg)
      w.terminate()
      worker = null
      readyP = null
      resolve({ output: '', error: { type: 'TimeoutError', message: `Your code ran for more than ${TIMEOUT_MS / 1000} seconds, so the lab stopped it. Is there a loop that never ends?`, line: 0, trace: '' }, checks: [], timedOut: true })
    }, TIMEOUT_MS)
    const onMsg = (e: MessageEvent) => {
      if (e.data?.id !== id) return
      clearTimeout(timer)
      w.removeEventListener('message', onMsg)
      resolve(e.data.result as PyRun)
    }
    w.addEventListener('message', onMsg)
    w.postMessage({ id, code, files, checks, aws })
  })
}
