// Content model for QA Quest. Every text a learner reads is bilingual: English first, Marathi below.
// Lesson flow: Real life -> How it solves the problem -> Lesson -> Syntax -> Practice -> Exam -> Recap.
import type { Place } from '../components/Backdrop.tsx'
import type { ApiDraft, ApiResponse } from '../api/http.ts'
import type { ApiExpect } from '../api/grade.ts'
import type { AppState, BugId } from '../selenium/app.ts'
import type { SkyBug, SkyState } from '../playwright/app.ts'
import type { PerfBug } from '../perf/server.ts'
import type { PerfResult } from '../perf/k6.ts'
export type { BugId, SkyBug, PerfBug }
export type { Place, ApiDraft, ApiExpect }

/** A bilingual string. `mr` is Marathi (technical words such as SELECT stay in English). */
export interface T {
  en: string
  mr: string
}
export type Text = string | T

export type CharacterId = 'meera' | 'theo' | 'rex' | 'sam' | 'gremlin' | 'you' | 'narrator'
export type Mood = 'neutral' | 'happy' | 'worried' | 'surprised' | 'smug' | 'angry'

export interface DialogueLine {
  who: CharacterId
  mood?: Mood
  text: T
}

export interface SceneItem {
  icon: string
  label: string
  /** optional Marathi label shown under the English one */
  mr?: string
}

/** Real-life (non-code) illustrated scenes, animated by AnalogyScene. */
export type Scene =
  | {
      type: 'match'
      leftTitle: T
      rightTitle: T
      left: SceneItem[]
      right: SceneItem[]
      links: [number, number][]
      mode: 'inner' | 'left'
    }
  | { type: 'filter'; rule: T; items: (SceneItem & { pass: boolean })[] }
  | { type: 'sort'; unit: string; top: number; items: (SceneItem & { value: number })[] }
  | { type: 'group'; groups: SceneItem[]; items: { icon: string; group: number }[]; note: T }
  | { type: 'ruler'; unit: string; min: number; max: number; lo: number; hi: number; marks: { value: number; note: string; mr: string }[] }
  | { type: 'steps'; steps: SceneItem[]; breakAt?: number; breakNote?: T }
  /** running total: each item adds to a growing tally */
  | { type: 'tally'; unit: string; items: (SceneItem & { value: number })[]; alertBelow?: number }
  /** a request travels from the client to the server, and a response travels back */
  | { type: 'exchange'; client: SceneItem; server: SceneItem; request: SceneItem; response: SceneItem; note?: T }

export interface CodeLine {
  code: string
  note?: T
}

export interface SqlStep {
  kind: 'sql'
  prompt: T
  starter?: string
  expected: string
  orderMatters?: boolean
  hints: T[]
  visual?: 'join'
  successLine?: T
}

export interface ChoiceStep {
  kind: 'choice'
  prompt: T
  options: Text[]
  correct: number[]
  explain: T
  hints: T[]
  sandbox?: boolean
  sandboxStarter?: string
  /** show the API console (pre-filled with this request) so the learner can investigate before answering */
  apiSandbox?: Partial<ApiDraft>
  /** show the Selenium lab with this code so the learner can run it before answering */
  seleniumSandbox?: { code: string; startUrl?: string; loggedIn?: boolean; build?: BugId[] }
  /** show the Playwright lab with this spec so the learner can run it before answering */
  playwrightSandbox?: { code: string; startUrl?: string; loggedIn?: boolean; build?: SkyBug[] }
  /** show the load-test lab with this k6 script so the learner can run it and read the results */
  perfSandbox?: { code: string; build?: PerfBug[] }
  successLine?: T
}

/** Write a Playwright test (TypeScript) that drives the SkyHop practice site. */
export interface PlaywrightStep {
  kind: 'playwright'
  prompt: T
  starter: string
  /** a correct spec, used by the content checker (never shown) */
  solution: string
  /** the page the practice browser shows before the test runs (the test itself starts at about:blank) */
  startUrl?: string
  /** Asha is already logged in (as if playwright.config.ts used a saved storageState) */
  loggedIn?: boolean
  /** plain TypeScript lesson: no browser, graded on console.log output */
  noBrowser?: boolean
  build?: SkyBug[]
  /** the test must FAIL on an assertion on `build`, and pass on the good build */
  expectFailure?: boolean
  minAssertions?: number
  minTests?: number
  mustUse?: { pattern: string; message: T }[]
  mustNotUse?: { pattern: string; message: T }[]
  verify?: { check: (s: SkyState) => boolean; message: T }[]
  output?: string[]
  /** fail if page.waitForTimeout was used */
  noWaitForTimeout?: boolean
  mustCatch?: { bug: SkyBug; label: T }[]
  starterPasses?: boolean
  hints: T[]
  successLine?: T
}

/** Write a k6 load test. It runs against the StageDoor server model in simulated time. */
export interface PerfStep {
  kind: 'perf'
  prompt: T
  starter: string
  solution: string
  /** run against a buggy server build */
  build?: PerfBug[]
  /** the thresholds must FAIL on `build` (and pass on the good build) */
  expectFailure?: boolean
  /** at least one threshold must be defined */
  requireThresholds?: boolean
  mustUse?: { pattern: string; message: T }[]
  mustNotUse?: { pattern: string; message: T }[]
  verify?: { check: (r: PerfResult) => boolean; message: T }[]
  /** exact console.log lines (for plain JavaScript warm-ups) */
  output?: string[]
  /** after passing, the thresholds must fail on each of these buggy builds */
  mustCatch?: { bug: PerfBug; label: T }[]
  starterPasses?: boolean
  hints: T[]
  successLine?: T
}

/** Write Java + Selenium code that drives the CareBridge practice app. */
export interface SeleniumStep {
  kind: 'selenium'
  prompt: T
  starter: string
  /** a correct script, used by the content checker (never shown) */
  solution: string
  /** the page the practice browser shows before the script runs */
  startUrl?: string
  /** start with Asha already logged in */
  loggedIn?: boolean
  /** plain Java lesson: hide the browser, show printed output */
  noBrowser?: boolean
  /** run against a buggy build of the app instead of the good one */
  build?: BugId[]
  /** the script must FAIL on an assertion (it proves the bug in the build) */
  expectFailure?: boolean
  /** at least this many assertions must run and pass */
  minAssertions?: number
  /** regular expressions the code must match (comments are ignored), with the message shown when missing */
  mustUse?: { pattern: string; message: T }[]
  mustNotUse?: { pattern: string; message: T }[]
  /** checks on the app's state after the run */
  verify?: { check: (s: AppState) => boolean; message: T }[]
  /** exact lines System.out.println must print */
  output?: string[]
  /** fail if Thread.sleep was used */
  noSleep?: boolean
  /** after passing, the same code is run on these buggy builds and must fail on each */
  mustCatch?: { bug: BugId; label: T }[]
  /** the starter already passes (a "just press Run" step) */
  starterPasses?: boolean
  hints: T[]
  successLine?: T
}

/** Build and send a request in the API console. Graded on the request and the server's answer. */
export interface ApiStep {
  kind: 'api'
  prompt: T
  starter?: Partial<ApiDraft>
  expect: ApiExpect
  /** a correct request, used by the content checker (and never shown) */
  solution: ApiDraft
  hints: T[]
  successLine?: T
}

/** Write Postman-style tests. They must pass on the real response and catch every planted bug. */
export interface TestStep {
  kind: 'test'
  prompt: T
  /** the request whose response is tested (sent automatically) */
  request: ApiDraft
  starter: string
  /** a correct test script, used by the content checker */
  solution: string
  mutants: { label: T; patch: (r: ApiResponse) => ApiResponse }[]
  hints: T[]
  successLine?: T
}

export type TaskStep = SqlStep | ChoiceStep | ApiStep | TestStep | SeleniumStep | PlaywrightStep | PerfStep

export interface ExamQ {
  q: T
  /** optional code shown with the question ("what does this return?") */
  code?: string
  options: Text[]
  answer: number
  explain: T
}

export type Level = 'basic' | 'intermediate' | 'advanced'

export interface Lesson {
  id: string
  code: string
  title: T
  skill: string
  level: Level
  isBoss?: boolean
  /** syntax shown as plain text, not SQL (for non-code lessons) */
  syntaxPlain?: boolean
  /** 1. Real life: an everyday situation, no code */
  realLife: { title: T; story: T; scene: Scene; place: Place }
  /** 2. How it solves the problem: the business problem at the client and how this tool fixes it */
  solves: { dialogue: DialogueLine[]; problem: T; solution: T }
  /** 3. Lesson: the concept in plain words */
  lesson: T[]
  /** 4. Syntax: the template, what each part means, and a worked example */
  syntax: { template: string; parts: { code: string; means: T }[]; example: CodeLine[]; exampleNote?: T; pitfall?: T }
  /** 5. Practice: hands-on in the live database */
  practice: { intro: T; steps: TaskStep[] }
  /** 6. Exam: graded questions; 75% to pass */
  exam: ExamQ[]
  recap: { line: T; icon: string }
  outro?: DialogueLine[]
}

export interface Act {
  id: string
  title: T
  client: string
  domain: T
  building: 'hq' | 'shop' | 'warehouse' | 'bank' | 'delivery' | 'payments' | 'clinic' | 'lab' | 'airline' | 'hangar' | 'arena' | 'stage' | 'pipeline'
  rank: string
  level?: Level
  lessons: Lesson[]
  available: boolean
}

export interface IncidentBeat {
  icon: string
  time: T
  text: T
}

export interface Incident {
  id: string
  title: T
  year: string
  unlockAfter: string
  headline: string
  counterLabel: T
  counterTo: number
  counterPrefix: string
  counterSuffix: string
  beats: IncidentBeat[]
  lesson: T
  source: { label: string; url: string }
  rewind: { intro: T; steps: TaskStep[] }
}
