<h1 align="center">✨ Talent-IQ ✨</h1>

<h3 align="center">RAG-Powered Adaptive Interview &amp; Career Intelligence Platform</h3>

Talent-IQ is a full-stack interview platform with two interview modes: live **human-to-human** interviews (video, chat, collaborative coding) and **retrieval-grounded AI interviews** that adapt to the candidate in real time. Every AI interaction — question generation, answer evaluation, follow-ups, code review, performance reports, and career roadmaps — is grounded in a retrieval-augmented generation (RAG) layer that pulls relevant reference material and the candidate's own history before the model ever responds.

## Features

- 🤖 **AI Interviews grounded in retrieval** — the interviewer retrieves domain knowledge, reference questions, and the candidate's past weak areas before asking anything
- 🧠 **Adaptive Interview Engine** — difficulty moves deterministically with performance (strong → deeper follow-up, weak → simpler conceptual question)
- 👥 **Human-to-Human Interviews** — 1-on-1 video rooms, mic/camera controls, screen sharing, recording, real-time chat, collaborative coding
- 💻 **AI Code Review** — correctness, time/space complexity, code quality, edge cases, and optimizations compared against a bank of reference solutions
- 📊 **Performance Analytics** — overall score, skill breakdown, interview history, and score trends
- 🧭 **AI Career Coach** — personalized improvement roadmap built from actual interview performance and retrieved learning material
- 🧩 **Coding Practice** — problem bank (curated in-house problems + the full Codeforces problem set, difficulty/tag/rating filters, search, per-user solved/attempted status), Monaco editor, 10 verified languages, **Run** (visible sample tests) vs **Submit** (hidden judging), hidden tests never returned to the client
- 🎯 **Role Readiness** — a deterministic, domain-aware engine that scores your demonstrated skills against a target role's requirements (built from interview question scores, performance metrics and solved problems — no estimation)
- 🎥 **Stream video infrastructure** — 1-on-1 rooms, room locking, live presence
- 🔐 **Authentication** — Clerk
- 🎨 **Smooth-scroll UI with GSAP** — purposeful entrance/scroll animations (Lenis + ScrollTrigger), `prefers-reduced-motion` respected

## Architecture

```text
User
 │
 ▼
React Frontend (Vite, TanStack Query, Clerk)
 │  every request goes through src/api/* → axios
 ▼
Express API  ── protectRoute (Clerk) ── rate limits ── request logger
 │                                     notFound + errorHandler
 ├───────────────────────────────┬───────────────────────────────┐
 ▼                               ▼                               ▼
MongoDB                       AI Layer                     Code execution
(models + indexes)                │                         (Wandbox sandbox)
 │                                │                               ▲
 │                                ├── aiClient (per-task routing)  │
 │                                │      ├── Groq  (primary)       │
 │                                │      └── Gemini (failover)     │
 │                                │                                │
 │                                ▼                                │
 │                          RAG Retriever                          │
 │                        (top-k, scored chunks)                   │
 │                                │                                │
 └──────────────► Analytics services ◄──────── codegen harness ────┘
                    ├── performance aggregation
                    ├── career roadmap
                    └── role readiness
```

The API never talks to a provider directly: all LLM traffic goes through
`services/ai/aiClient.js` and all vector traffic through
`services/rag/vectorStore.service.js`, so providers can be swapped in one place.

Every AI action follows the same pattern:

```text
Interview state (role, topic, difficulty, weak areas)
        │
        ▼
  RAG RETRIEVER ──► top-k relevant chunks (source, chunk id, score, content)
        │
        ▼
  LLM prompt = [SYSTEM INSTRUCTION] + [RETRIEVED CONTEXT] + [CANDIDATE CONTEXT] + [TASK]
        │
        ▼
  defensive JSON parse → per-task schema validation → clamp/sanitize → store
```

Every AI action follows the same pattern:

```text
Interview state (role, topic, difficulty, weak areas)
        │
        ▼
  RAG RETRIEVER ──► top-k relevant chunks
        │
        ▼
  LLM prompt = [SYSTEM INSTRUCTION] + [RETRIEVED CONTEXT] + [CANDIDATE STATE] + [TASK]
        │
        ▼
  structured JSON (validated before storing)
```

If retrieval returns nothing relevant, the system falls back to the model's general knowledge and flags the response as ungrounded internally (and in retrieval logs) instead of blocking the interview.

## Tech Stack

**Frontend**
- React 19 + Vite, Tailwind CSS v4 + daisyUI
- Clerk (auth), Stream Video + Chat SDKs
- Monaco Editor (`@monaco-editor/react`), react-resizable-panels
- TanStack Query, react-router v7, react-hot-toast, date-fns, lucide-react
- GSAP (ScrollTrigger + Flip), Lenis smooth scrolling

**Backend**
- Node.js + Express 5, Mongoose (MongoDB)
- Clerk (JWT auth middleware), Stream Node SDK, Inngest (background jobs)
- LLM layer over plain `fetch`, routed **per task** via `aiClient.js`: **Groq** is the primary for all tasks (question generation, follow-ups, evaluation, code review, reports, roadmaps), with **Gemini** as the automatic failover when Groq is rate-limited. The routing is configurable per task through `AI_PROVIDER_*` env vars.
- Problem bank: Mongoose `Problem` + `ProblemSubmission` models, seeded on boot with 13 LeetCode-style problems; per-language starter code + judge harnesses generated from a neutral spec (`services/problems/codegen.service.js`)
- Code execution: **Wandbox API** (keyless) — the previous Piston provider became whitelist-only in Feb 2026, so it was replaced
- RAG: embedding service (Gemini or local hashing) + provider-agnostic vector store (MongoDB Atlas `$vectorSearch` with in-process cosine-similarity fallback)

## Environment Variables

### Backend (`/backend/.env`)

```bash
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_URL=your_mongodb_connection_url

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI / LLM (required for AI interviews, code review, reports, roadmap)
# Groq first; Gemini fallback when Groq's rate limit is hit.
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional model overrides:
# GROQ_MODEL=groq/compound-mini
# GEMINI_MODEL=gemini-3.6-flash

# Embeddings: gemini (free API) or local hashing (no key needed)
# EMBEDDING_PROVIDER=local
# EMBEDDING_MODEL=gemini-embedding-001
# VECTOR_TOP_K=6
```

### Frontend (`/frontend/.env`)

```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3000/api
VITE_STREAM_API_KEY=your_stream_api_key
```

See `.env.example` in each folder. **Never commit `.env` files.**

## Coding Practice (Problem Bank)

- **Sources** — the in-house problems in `backend/src/data/problems.seed.js` are original, written in a LeetCode-style format (title, slug, difficulty, tags, markdown description, constraints, examples, starter code, hidden + visible test cases, solution approach) — no scraping, since LeetCode content is copyrighted. The Codeforces problem set is ingested from the public Codeforces API and stored as **metadata only** (contestId, index, name, rating, tags, URL).
- **Languages** — 10 languages work end-to-end (run + submit + judge): **C, C++, Java, Python, JavaScript, C#, Go, Rust, PHP, Ruby**. TypeScript, Kotlin, and Swift are **not** shown in the language selector: the Wandbox runtimes for them are broken (TS ignores compiler flags and lacks a modern lib; Swift crashes; no Kotlin runtime), so per the project's honesty rule they are hidden rather than left silently non-functional.
- **Judging** — `POST /api/problems/:slug/submit` replaces the user's solution into a generated harness per language, runs it against the problem's sample **and** hidden test cases in the sandbox, compares canonical expected output, and records per-user status. Hidden test details are never sent to the client.
- **Running** — `POST /api/problems/:slug/run` uses only the visible sample tests and returns structured per-test results (input / expected / actual / passed). It never records solved status, so candidates can iterate freely.
- **Execution security** — the browser never executes code. Every run (practice problems *and* the human-session collaborative editor) goes through one authenticated, rate-limited, size-limited endpoint backed by the remote sandbox. Submitted code is treated as untrusted and has no access to application secrets or the database.
- **Per-user status** — solved / attempted counts come from `ProblemSubmission` records, shown on the practice list and problem page.

## Codeforces Integration

Talent-IQ never scrapes Codeforces, never automates login, and never asks for or
stores Codeforces credentials. It uses the public `problemset.problems` API only,
with a 20s timeout, shape validation, upserts keyed on `externalId` (so repeated
syncs never duplicate) and a graceful failure path — if Codeforces is down the
bank keeps serving whatever is already stored, and the UI shows a clear message
instead of spinning forever.

Every external problem card and detail page has a **Practice on Codeforces**
button that opens the official problem page in a new tab
(`https://codeforces.com/problemset/problem/{contestId}/{index}`). Codeforces
owns authentication, the statement and the judge; Talent-IQ owns discovery,
metadata, filtering, bookmarking and progress tracking.

## Role Readiness (domain-aware AI)

`GET /api/role-readiness?role=<slug>` compares what a candidate has actually
demonstrated against the skill requirements of a target role. The engine is
**deterministic and evidence-based**:

```text
interview question scores (per topic)  ─┐
performance report metrics              ─┼─►  per-skill score (0-100)
solved practice problems                ─┘            │
                                                       ▼
                                       overall readiness + strong areas
                                       + gaps + prioritised next steps
```

A skill with no supporting evidence is reported as `no_data` — it is never
estimated. Results drive prioritised next steps and feed the career roadmap.

## Quality Engineering

```bash
# backend — unit tests for the business logic (no network, no DB required)
cd backend && npm test        # node:test — scores, adaptivity, validation, URLs
cd backend && npm run lint    # syntax gate over every source file

# frontend
cd frontend && npm run lint   # ESLint (0 errors, 0 warnings)
cd frontend && npm run build  # production build
```

Tests cover the logic that is expensive to get wrong and easy to verify in
isolation: adaptive difficulty transitions, deterministic topic selection,
AI JSON schema validation + clamping, performance-report aggregation,
problem filtering/pagination, Codeforces rating→difficulty mapping and URL
generation, the API response envelope, and the role-readiness engine.

CI (`.github/workflows/ci.yml`) runs install → lint → test → build for both
packages on every push and pull request, plus a secret guard that fails the
build if any `.env` file is tracked.

## Local Setup

### 1. Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure environment

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in the values (Clerk, Stream, MongoDB, Groq, Gemini).

### 3. Run the backend

```bash
cd backend
npm run dev
```

The API runs on `http://localhost:3000`.

### 4. Ingest the knowledge base (one-time)

The RAG layer reads from checked-in reference material in `backend/src/data/knowledge/`. Populate the vector store once (development only):

```bash
curl -X POST http://localhost:3000/api/rag/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_clerk_session_token>" \
  -d '{"source":"all"}'
```

`source` can be `all`, `job-knowledge`, or `question-bank`. Ingestion is idempotent (upserts on stable keys). Candidate history is ingested automatically when an AI interview completes.

### 5. Run the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

### Vector search index (optional)

On **MongoDB Atlas**, create a vector search index named `vector_index` on the `knowledgedocuments` collection, path `embedding`, with dimensions matching your embedding model (3072 for `gemini-embedding-001` as returned by the API, 384 for the local provider). Without the index, the vector store transparently falls back to in-process cosine similarity over the same collection, so everything still works on a free/local MongoDB.

## How the AI Features Work

### AI Interviews (RAG-grounded)

1. The candidate configures an interview (role, experience level, duration, topics, difficulty).
2. The interview is seeded with the candidate's recurring weak/strong areas from past interviews.
3. For each question, the **retriever** queries the vector store across `job-knowledge`, `question-bank`, and `candidate-history` collections using the current interview state.
4. Retrieved chunks are injected into the LLM prompt as grounding context, clearly separated from the instruction.
5. The model returns structured JSON (question text, topic, difficulty, follow-up hint), which is validated before being stored with the retrieved context IDs for traceability.

### Adaptive Engine

After each answer, the candidate's response is evaluated against retrieved reference material. A deterministic scoring strategy updates the interview state:

- **Score ≥ 8** → difficulty up one level, deeper follow-up on the same topic
- **Score ≤ 4** → difficulty down one level, simpler conceptual follow-up
- **Otherwise** → stay at the current level, move to a new topic (weak areas are prioritized)

No randomness — the next question always follows from the evaluated performance.

### AI Code Review

After submitting code (in practice problems or human sessions), the code is sent to `POST /api/code/review`. The retriever pulls known-good solutions and optimization patterns for that problem from the `question-bank` collection (in practice problems, the problem's own `solutionApproach` is injected as grounding), and the review covers correctness, time/space complexity, code quality, missing edge cases, and a concrete optimization suggestion. Reviews run on **Gemini** (deeper analysis). Test-case results are always shown to the candidate; AI review is an additional layer, not a gate.

### Provider routing (Groq vs Gemini)

All LLM calls go through `services/ai/aiClient.js`, which exposes one interface (`generateStructured({ task, prompt, schema, useFallback })`) and routes per task. The mapping lives in one place and is overridable per task via `AI_PROVIDER_<TASK>` env vars:

- **Groq** (default for all tasks) — `question`, `followup`, `evaluate`, `review`, `report`, `roadmap`
- **Gemini** — automatic failover when Groq is rate-limited; can be set as primary for any task via env

If the primary provider fails or is rate-limited, the client retries once on the other provider; if both fail, a local heuristic (or a safe default) is used and the failure is logged rather than crashing the request. Every response is parsed defensively (markdown fences stripped) and validated against the expected schema before it is returned.

### Performance Dashboard & Career Coach

Completed AI interviews produce a structured performance report (technical / coding / communication / problem-solving / overall scores, strengths, weaknesses). The dashboard aggregates these over time. The career coach builds a personalized multi-week roadmap grounded in the candidate's actual scores, skill gaps, and retrieved learning material from the `job-knowledge` collection.

## API Overview

```text
POST /api/interviews/ai/create        create & configure an AI interview
POST /api/interviews/ai/question      get / generate the current question
POST /api/interviews/ai/answer        submit an answer (returns feedback + next question)
POST /api/interviews/ai/complete      finish → generates performance report
GET  /api/interviews                  list my interviews
GET  /api/interviews/:id              full interview detail (questions, report, submissions)
POST /api/interviews/:id/abort        abort an interview

POST /api/code/review                 AI code review (all 10 executable languages)
POST /api/code/execute                sandboxed standalone snippet (human-session editor)

GET  /api/problems                    list problems (source, difficulty, tag, rating, search)
GET  /api/problems/:slug              problem detail (description, starter code per language, examples)
POST /api/problems/:slug/run          run against VISIBLE sample tests (never records status)
POST /api/problems/:slug/submit       judge against sample + hidden tests, record status
GET  /api/problems/progress           per-user solved/attempted/bookmarked summary
POST /api/problems/:slug/bookmark     toggle bookmark

GET  /api/performance                 aggregated performance dashboard
GET  /api/performance/:interviewId    single interview performance

GET  /api/role-readiness?role=...     role readiness from stored data
GET  /api/role-readiness/requirements the role → skill matrix used for scoring

GET  /api/career-roadmap              latest roadmap
POST /api/career-roadmap/generate     generate a personalized roadmap

POST /api/rag/ingest                  ingest knowledge base (dev only)
POST /api/rag/search                  debug retrieval (dev only)
GET  /api/rag/stats                   knowledge base stats

GET  /health                          liveness probe

# existing endpoints preserved
POST /api/sessions ...                human interview sessions (video/chat/code)
GET  /api/chat/token                  Stream token
```

Every modern endpoint uses one envelope and one error shape:

```json
{ "success": true, "data": {} }
{ "success": false, "message": "Human readable message", "code": "VALIDATION_ERROR" }
```

`code` is a stable machine-readable identifier (`NOT_FOUND`, `VALIDATION_ERROR`,
`HARNESS_MODIFIED`, `EXECUTION_UNAVAILABLE`, `SERVICE_UNAVAILABLE`, ...). Unknown
routes return `ROUTE_NOT_FOUND`; unhandled errors are normalized by the central
error handler and never leak stack traces in production.

### Run vs Submit

| | `POST /:slug/run` | `POST /:slug/submit` |
| --- | --- | --- |
| Test cases | visible sample tests only | sample + hidden tests |
| Records solved status | no | yes |
| Returns | per-test input/expected/actual | counts + visible sample detail |
| Hidden tests exposed | never | never |

## Project Structure

```text
backend/
  scripts/           # check-syntax (CI gate), verify-codegen (language smoke test)
  src/
    controllers/     # interview, code review/execute, performance, career coach,
                     # RAG, problems (list/detail/run/submit), role readiness
    data/            # knowledge/ (checked-in reference material) + problems.seed.js
    lib/             # env, db, stream, inngest, rate limits, apiResponse envelope
    middleware/      # Clerk protectRoute, errorHandler + requestLogger
    models/          # Session, User, Interview, InterviewQuestion, CodeSubmission,
                     # Performance, CareerRoadmap, KnowledgeDocument, RetrievalLog,
                     # Problem, ProblemSubmission
    routes/          # REST API routes
    services/
      ai/            # aiClient + providers/ (groq, gemini), embedding, interview
                     # (adaptive engine), evaluation, codeReview, careerCoach,
                     # prompts, topics  (+ *.test.js)
      analytics/     # roleReadiness engine (deterministic, evidence-based)
      problems/      # codegen (starter code + judge harnesses), executor (Wandbox),
                     # problemQuery (filters/pagination), seed
      rag/           # vectorStore (provider-agnostic), ingestion, retriever
frontend/
  src/
    api/             # axios API modules (interviews, problems, code, performance,
                     # careerRoadmap, roleReadiness, sessions)
    components/      # UI components (markdown renderer, charts, AI review, ...)
    data/            # languages.js (editor language matrix)
    hooks/           # TanStack Query hooks
    lib/animations/  # GSAP setup, Lenis smooth scroll, reveal/count-up hooks
    pages/           # landing, dashboard, interviews (AI + human), practice,
                     # performance, role readiness, career roadmap, results
```

## AI Service Design Notes

- **Modular AI layer** — all LLM calls go through `services/ai/aiClient.js` (with per-task provider routing to Groq/Gemini via `services/ai/providers/`). No OpenAI/other SDKs are used.
- **Swappable vector store** — all vector operations go through `services/rag/vectorStore.service.js`. The rest of the codebase never talks to a provider SDK directly.
- **Structured output** — prompts request JSON and responses are validated/sanitized before persisting; malformed output is retried, then a safe fallback is used.
- **Graceful degradation** — LLM failure, retrieval failure, or a missing API key never crashes the app; the UI shows "AI interviewer is temporarily unavailable" and retrieval falls back to ungrounded generation. Performance reports and career roadmaps fall back to deterministic, data-derived versions so the page always renders something honest.
- **Never trust AI output** — every model response is defensively parsed (markdown fences/preamble stripped), validated against a per-task schema, clamped to valid ranges and only then stored. Malformed output triggers one stricter retry, then a safe default.
- **Centralized error handling** — one error handler and one 404 handler normalize every failure into the standard envelope with a stable `code`. Technical detail (including stack traces) is logged server-side only.
- **Validation at the edge** — request bodies, language identifiers, code size, pagination and AI responses are all bounded and validated before expensive work happens.
- **Rate limiting** — AI, code review/execution and RAG endpoints are rate limited (`express-rate-limit`).
- **Observability** — a dependency-free request logger records method, path, status and duration; production logs never contain secrets or answer content.
- **Responsible AI** — AI assessments are labeled as guidance in the UI and are derived only from observable interview/coding performance; no protected characteristics are inferred.
- **Secure by default** — all code execution happens in a remote sandbox (never on the API host), submitted code is treated as untrusted, hidden tests are never serialized to the client, and markdown from AI output is rendered without raw HTML.

## Screenshots

_Screenshots to be added._

## License

ISC
