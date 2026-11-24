# QA Quest

A story-driven browser game that teaches a manual tester SQL and database testing, then API testing, UI automation with Selenium and Java, modern UI automation with Playwright and TypeScript, and performance testing with k6, from the basics to senior-level topics. Every screen is in English with Marathi directly below. Full design: the "QA Quest — Learning Game PRD" doc.

## Run it

You need [Node.js](https://nodejs.org/) 22.6 or newer (it comes with npm) and Git. Everything runs in the browser: there is no server, database or account to set up.

```bash
git clone https://github.com/ShubhamDigole/learning-lab.git
cd learning-lab
npm install        # first time only, takes a minute or two
npm run dev        # then open http://localhost:5173 in Chrome, Edge or Firefox
```

Stop it with `Ctrl + C` in the terminal. Progress is saved in your browser, so you can close the tab and continue later on the same computer and browser.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds a production version into `dist/` |
| `npm run preview` | Serves that production build at http://localhost:4173 |
| `npm run check:content` | Runs every lesson's answers, scripts and tests to prove they still work (takes a few minutes) |
| `npm run check:content -- --only=pw1-,pf` | The same check for some lessons only (lesson ids starting with these) |

If `npm run dev` says the port is busy, it picks the next free one (for example 5174); use the address it prints.

## Every lesson, seven steps

1. **Real life**: an everyday example with an animated scene, no code
2. **How it solves the problem**: the client's problem, and how this SQL tool fixes it
3. **Lesson**: the idea in plain words
4. **Syntax**: template, what each part means, annotated example, common mistake
5. **Practice**: hands-on queries in a live in-browser Postgres
6. **Exam**: 4 graded questions, 3 to pass, shuffled on retake
7. **Recap**: saved to the Case Journal and reused in Daily Standups

## The SQL track (23 lessons)

| Level | Client | Topics |
| --- | --- | --- |
| Prologue | Kestrel HQ | Boundary values |
| Start here | ShopSprout | What is a database? What is SQL, and why do testers use it? (no prior knowledge) |
| SQL 1 Foundations | ShopSprout | SELECT/WHERE, ORDER BY/LIMIT, GROUP BY/HAVING, INNER JOIN, LEFT JOIN + IS NULL, boss |
| SQL 2 Intermediate | BazaarHub feed | NULL/COALESCE, IN/BETWEEN/LIKE, CASE, subqueries/EXISTS, duplicates & constraints, INSERT/UPDATE & transactions, boss |
| SQL 3 Advanced | Ledgerly Bank | CTEs, ROW_NUMBER/RANK, LAG/LEAD, running totals, UNION/INTERSECT/EXCEPT, EXPLAIN & indexes, boss |

## The API track (17 lessons)

| Level | Client | Topics |
| --- | --- | --- |
| Start here | TiffinGo | What is an API? Request, response and the URL |
| API 1 Foundations | TiffinGo | HTTP methods, status codes, reading JSON, path and query parameters, body and headers, tokens/401/403, boss |
| API 2 Like a Pro | TiffinGo Pay | Negative testing, automated checks with pm.test, chaining requests, schema/contract testing, idempotency, pagination and response time, cross-checking the API with SQL, boss |

Practice happens in a Postman-style console against a practice API that runs inside the browser (no network). It has 10 planted bugs for the learner to find: a broken veg filter, qty 0 accepted, a coupon that makes totals negative, other customers' orders readable, double charges without an idempotency key, a pagination repeat, a contract break, a slow search, a failing endpoint and an unprotected internal endpoint. Test-writing tasks grade your Postman tests by planting bugs in the response: your tests must pass on the real answer and catch every planted bug.

The practice API's orders and payments are mirrored into the in-browser Postgres (`tg_orders`, `tg_order_items`, `tg_payments`), so a lesson can prove with SQL what an API call really stored.

## The Selenium + Java track (15 lessons)

| Level | Client | Topics |
| --- | --- | --- |
| Start here | CareBridge | What test automation and Selenium are, just enough Java |
| Selenium 1 Foundations | CareBridge | First test, locators, XPath and stable locators, interactions, assertions, waits, boss |
| Selenium 2 Like a Pro | CareBridge Labs | Page Object Model, lists and loops, alerts and stale elements, TestNG setup and DataProvider, flaky tests and SoftAssert, boss |

She writes real Java in an editor next to a practice browser showing CareBridge, a small clinic web app. Run plays the script with a robot cursor that highlights each element it finds, clicks or types into, while a TestNG-style log shows every command. The Java is interpreted in the browser (a Selenium-sized subset: variables, loops, classes for page objects, TestNG annotations and data providers), and the WebDriver look-alike throws the real Selenium exceptions with their real messages. The app has 13 switchable bugs; Submit re-runs her test against buggy builds and it passes only if it catches them.

## The Playwright + TypeScript track

| Level | Client | Topics |
| --- | --- | --- |
| Start here | SkyHop Airlines | Meet Playwright, just enough TypeScript |
| Playwright 1 Foundations | SkyHop Airlines | First test, user-facing locators and strict mode, actions, web-first assertions and auto-waiting, lists and filters, boss "Lost Luggage" |
| Playwright 2 Like a Pro | SkyHop Ops | Hooks and Page Object Model, network watching and mocking, API testing with `request` plus UI, dialogs, debugging and CI, boss "The Release Gate" |

She writes real TypeScript (types are stripped with sucrase) beside a practice browser showing SkyHop, an airline site with search, seats, payment, trips, check-in and a baggage tracker. A Playwright look-alike runs the spec: locators auto-wait and are strict, assertions retry, `page.route` mocks the site's network, `request` calls its API, and errors use Playwright's real wording. A missing `await` is caught and explained. The site has 15 switchable bugs; Submit re-runs her test against buggy builds.

## The performance track (k6)

| Level | Client | Topics |
| --- | --- | --- |
| Start here | StageDoor | What performance testing is, reading the numbers (averages vs percentiles) |
| Performance 1 Foundations | StageDoor | First k6 script, checks, think time and stages, thresholds and tags, boss "The Flash Sale" |
| Performance 2 Like a Pro | StageDoor Live | Stress and spike tests, soak tests, real data and correlation, arrival-rate scenarios and JMeter, boss "Opening Night" |

She writes real k6 scripts. The lab simulates them against a model of the StageDoor ticketing server (a pool of web workers, a small payment-gateway pool, load shedding) in simulated time, so a 20-minute soak test finishes in about a second. Each k6 iteration replays its earlier responses so every request reaches the server in true time order, which makes queueing, slowdowns and errors behave realistically. The run plays back as a live chart, then shows the real k6 end-of-test summary with thresholds. Six switchable performance problems (no cache, slow seat map, small payment pool, memory leak, slow login, errors under load) must be caught by her thresholds.

After the prologue, every track can be played in any order. Next on the roadmap: data engineering (Python, PySpark, AWS Glue, Lambda, S3 and a data warehouse).

Incident files: TSB 2018 (SQL), Optus 2022 (API), HealthCare.gov 2013 (Selenium), plus one each for Playwright and performance, each with an animated replay, then "rewind and catch it".

## Look and feel

The map is a quest map: each track's buildings sit on a winding trail with your avatar on it, and each building opens its own level trail (levels on a path, stars, a pulsing "you are here" level, the boss, incident files on side branches and a rank trophy at the end).


Every story moment plays on an illustrated background matching the topic (shop, bank, library, wedding hall, railway station and 9 more, drawn in `src/components/Backdrop.tsx`). The cast stands on stage and the speaker's mouth moves while the line types out. Lessons have a sticky action bar so Back and Next are always visible. Design guidance lives in `.claude/skills/frontend-design` (Anthropic's frontend-design skill, Apache 2.0).

## How it works

- `src/db/seed.ts`: deterministic data for all three clients, loaded into **PGlite** (Postgres in WebAssembly).
- `src/db/compare.ts`: grades by result set, so any correct query passes.
- `src/api/server.ts`: the TiffinGo practice API (data in `src/api/data.ts`), `src/api/grade.ts` grades requests, `src/api/pm.ts` runs Postman-style tests, `src/api/mutants.ts` plants bugs for test tasks.
- `src/selenium/`: the CareBridge app (`app.ts`), the Java interpreter (`java.ts`), the WebDriver look-alike and TestNG runner (`runner.ts`) and grading (`grade.ts`).
- `src/playwright/`: the SkyHop site and backend (`app.ts`), the Playwright look-alike and test runner (`runner.ts`) and grading (`grade.ts`).
- `src/perf/`: the StageDoor server model (`server.ts`), the k6 look-alike and simulator (`k6.ts`) and grading (`grade.ts`).
- `src/content/sql*.ts`, `api*.ts`, `sel*.ts`, `pw*.ts`, `pf*.ts`: all lessons as bilingual data (`{ en, mr }`).
- `npm run check:content` (or `-- --only=pw1-,pf` for some lessons): runs every expected SQL answer, request, Postman test, Selenium script, Playwright spec (in jsdom) and k6 script, and checks every story number, exam answer and that every text has both languages.

Progress is saved in the browser's localStorage. The `मराठी` button in the top bar hides or shows Marathi.
