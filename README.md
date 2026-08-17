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
- 🧩 **Coding Practice** — LeetCode-style problem bank (13 curated problems, difficulty + tag filters, search, per-user solved/attempted status), VSCode-powered Monaco editor, 10 fully-working languages, hidden test-case judging via Wandbox
- 🎥 **Stream video infrastructure** — 1-on-1 rooms, room locking, live presence
- 🔐 **Authentication** — Clerk
- 🎨 **Smooth-scroll UI with GSAP** — purposeful entrance/scroll animations (Lenis + ScrollTrigger), `prefers-reduced-motion` respected

## Architecture

```text
Frontend (React + Vite)
        │
        ▼
   REST API (Express)
        │
        ▼
      MongoDB ──────────────► Vector store (MongoDB collection + embeddings)
        │
        ▼
    AI Service ──► RAG Retriever ──► Vector Database
        │                              (job-knowledge / question-bank /
        ▼                               candidate-history collections)
Interview Evaluation
        │
        ▼
   Performance → Career Roadmap
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

- **Source** — the 13 problems in `backend/src/data/problems.seed.js` are original, written in-house in a LeetCode-style format (title, slug, difficulty, tags, markdown description, constraints, examples, starter code, hidden + visible test cases, solution approach). No scraping — LeetCode content is copyrighted.
- **Languages** — 10 languages work end-to-end (run + submit + judge): **C, C++, Java, Python, JavaScript, C#, Go, Rust, PHP, Ruby**. TypeScript, Kotlin, and Swift are **not** shown in the language selector: the Wandbox runtimes for them are broken (TS ignores compiler flags and lacks a modern lib; Swift crashes; no Kotlin runtime), so per the project's honesty rule they are hidden rather than left silently non-functional.
- **Judging** — `POST /api/problems/:id/submit` replaces the user's solution into a generated harness per language, runs it against the problem's hidden test cases on Wandbox, compares canonical expected output, and records per-user status.
- **Per-user status** — solved / attempted counts come from `ProblemSubmission` records, shown on the practice list and problem page.

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

POST /api/code/review                 AI code review

GET  /api/problems                    list problems (filters: difficulty, tag, search)
GET  /api/problems/:slug              problem detail (description, starter code per language, examples)
POST /api/problems/:slug/run          run code against visible sample tests
POST /api/problems/:slug/submit       judge against hidden tests, record per-user status
GET  /api/problems/status             per-user solved/attempted summary

GET  /api/performance                 aggregated performance dashboard
GET  /api/performance/:interviewId    single interview performance

GET  /api/career-roadmap              latest roadmap
POST /api/career-roadmap/generate     generate a personalized roadmap

POST /api/rag/ingest                  ingest knowledge base (dev only)
POST /api/rag/search                  debug retrieval (dev only)
GET  /api/rag/stats                   knowledge base stats

# existing endpoints preserved
POST /api/sessions ...                human interview sessions (video/chat/code)
GET  /api/chat/token                  Stream token
```

Responses use a consistent envelope: `{ "success": true, "data": {} }` or `{ "success": false, "message": "..." }`.

## Project Structure

```text
backend/
  src/
    controllers/     # interview, code review, performance, career coach, RAG, problems
    data/            # knowledge/ (checked-in reference material) + problems.seed.js
    lib/             # env, db, stream, inngest, rate limits
    middleware/      # Clerk protectRoute
    models/          # Session, User, Interview, InterviewQuestion, CodeSubmission,
                     # Performance, CareerRoadmap, KnowledgeDocument, RetrievalLog,
                     # Problem, ProblemSubmission
    routes/          # REST API routes
    services/
      ai/            # aiClient + providers/ (groq, gemini), embedding, interview
                     # (adaptive engine), evaluation, codeReview, careerCoach, prompts, topics
      problems/      # codegen (per-language starter code + judge harnesses), executor
                     # (Wandbox), seed (boot-time seeding)
      rag/           # vectorStore (provider-agnostic), ingestion, retriever
frontend/
  src/
    api/             # axios API modules
    components/      # UI components (readiness card, charts, AI review panel, ...)
    hooks/           # TanStack Query hooks
    lib/animations/  # GSAP setup, Lenis smooth scroll, reveal/count-up hooks
    pages/           # landing, dashboard, interviews (AI + human), practice,
                     # performance, career roadmap, results
```

## AI Service Design Notes

- **Modular AI layer** — all LLM calls go through `services/ai/aiClient.js` (with per-task provider routing to Groq/Gemini via `services/ai/providers/`). No OpenAI/other SDKs are used.
- **Swappable vector store** — all vector operations go through `services/rag/vectorStore.service.js`. The rest of the codebase never talks to a provider SDK directly.
- **Structured output** — prompts request JSON and responses are validated/sanitized before persisting; malformed output is retried, then a safe fallback is used.
- **Graceful degradation** — LLM failure, retrieval failure, or a missing API key never crashes the app; the UI shows "AI interviewer is temporarily unavailable" and retrieval falls back to ungrounded generation.
- **Rate limiting** — AI and RAG endpoints are rate limited (`express-rate-limit`).

## Screenshots

_Screenshots to be added._

## License

ISC
