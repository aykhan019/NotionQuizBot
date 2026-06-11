# QuizBot — course material in, practice questions out

QuizBot turns study material into a multiple-choice practice quiz. Paste your
lecture notes, upload a PDF, or pull from a Notion page; it uses an LLM to write
questions, and **every question comes with an explanation and a topic tag**, so
it works as a study tool rather than a trivia toy.

It's a small full-stack app: a **React** front-end and a **Flask** API that
extracts text from your material, calls **Google Gemini Flash-Lite**, validates
the result against a strict schema, and returns a clean quiz.

<!-- Add a short screen recording at docs/demo.gif -->
![QuizBot demo](docs/demo.gif)

## Table of Contents

- [Why this exists (Unicourse angle)](#why-this-exists-unicourse-angle)
- [How it works](#how-it-works)
- [Features](#features)
- [Quickstart (under 5 minutes)](#quickstart-under-5-minutes)
- [Input sources](#input-sources)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Tests & quality gate](#tests--quality-gate)
- [Deployment](#deployment)
- [License](#license)

## Why this exists (Unicourse angle)

[Unicourse](https://unicourse.io) is an education company whose product turns
course material — lecture content, plus GPA and exam-grade calculators — into
things students actually learn from. That framing is exactly what this project
does:

> **Course content in → practice sets out.**

A student drops in the material for a course (notes, a lecture PDF) and gets a
focused set of practice questions, each with an explanation and a topic tag they
can revise from. Then the app keeps them coming back: a **progress dashboard**
showing per-topic mastery, **spaced review** of missed questions, and the same
kind of **grade & GPA calculators** Unicourse already ships — turning a one-shot
generator into a study companion that *gets used*.

It's deliberately small and practical, supports any course's material rather
than one hardcoded source, and runs from a fresh clone in minutes with the demo
working on no account or external data. Notion is kept as one supported input —
not the only one — to show real external-API integration without tying the tool
to a single person's notes.

## How it works

```
            ┌──────────────────────────── React client ────────────────────────────┐
            │  Setup: paste text │ upload PDF │ Notion page IDs                      │
            │  + difficulty + question count                                         │
            └────────────────────────────────┬───────────────────────────────────────┘
                                              │  POST /api/quiz/generate(-pdf)
                                              ▼
            ┌──────────────────────────── Flask API ────────────────────────────────┐
            │  1. Get text from the chosen source:                                   │
            │       • pasted text                                                    │
            │       • PDF  → PyMuPDF text extraction                                 │
            │       • Notion → official notion-client (token stays server-side)      │
            │  2. Build a prompt (difficulty-aware)                                   │
            │  3. Gemini Flash-Lite with a strict JSON response schema               │
            │  4. Validate server-side, retry once, de-duplicate                     │
            └────────────────────────────────┬───────────────────────────────────────┘
                                              │  { quiz: [ {question, options,
                                              │            correct_answer,
                                              ▼            explanation, topic} ] }
            ┌──────────────────────────── React client ────────────────────────────┐
            │  Quiz runner (per-question feedback) → review screen with              │
            │  explanations + topics → "retry wrong ones only"                       │
            └─────────────────────────────────────────────────────────────────────────┘
```

**Secrets never touch the front-end.** The Gemini key and Notion token live only
in backend environment variables; the browser only ever sends the material (or
Notion page IDs) and gets back a quiz.

## Features

**Generate**
- **Three input sources** — paste text, upload a PDF, or read from Notion.
- **Study-useful questions** — each carries an explanation and a topic tag.
- **Difficulty + count controls** — easy / medium / hard, 1–20 questions.
- **Server-side validation** — strict JSON schema, retry-once, de-duplication.
- **Swappable LLM** — Gemini today, behind a one-file provider interface.

**Practice**
- **Immediate per-question feedback** — right/wrong, the correct answer, and why.
- **Review screen** — full breakdown with explanations and topics.
- **Retry wrong ones only** — drill the questions you missed.

**Stick with it** (database-backed)
- **Progress dashboard** — per-topic mastery (weakest first) and quiz history.
- **Spaced review** — missed questions are queued and resurfaced on a schedule.
- **Grade & GPA calculators** — "what do I need on the final?" and a GPA tool.
- **Shareable quizzes** — every quiz gets a link; classmates open the same one.

> No login: history and review are scoped to an anonymous per-browser id.

## Quickstart (under 5 minutes)

**Prerequisites:** Node.js 18+, Python 3.9+, and a free
[Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/aykhan019/NotionQuizBot.git
cd NotionQuizBot
```

### Option A — Make (recommended)

```bash
make setup                                        # server venv + client deps
cp flask-server/.env.example flask-server/.env    # then add your GEMINI_API_KEY
make server                                       # terminal 1 → http://localhost:5000
make client                                       # terminal 2 → http://localhost:3000
```

Try it without the UI:

```bash
make seed     # prints a quiz generated from the bundled sample
```

### Option B — Docker (one command)

```bash
cp .env.example .env        # add your GEMINI_API_KEY
docker compose up --build   # client :3000, server :5000
```

### Option C — manual

```bash
# Backend
cd flask-server
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # add GEMINI_API_KEY
python app.py                # http://localhost:5000

# Frontend (new terminal)
cd client
npm install
npm start                    # http://localhost:3000
```

No Notion or account is needed — use **Paste text** with the file in
[`sample/`](sample/), or **Upload PDF** with `sample/data-structures-basics.pdf`.

> **macOS note:** port 5000 is used by AirPlay Receiver. If the backend won't
> bind, run it on another port — `PORT=5055 python app.py` — and set the client's
> `REACT_APP_API_BASE_URL` accordingly (or disable AirPlay Receiver in System
> Settings → General → AirDrop & Handoff).

## Input sources

| Source | What you provide | How text is obtained |
| --- | --- | --- |
| **Text** | Pasted course material | Used directly |
| **PDF** | An uploaded lecture PDF | Text layer extracted with PyMuPDF |
| **Notion** | One or more page IDs | Read via the official `notion-client`; the token is a backend env var |

> Notion setup: create an integration at
> [notion.so/my-integrations](https://www.notion.so/my-integrations), share your
> pages with it, set `NOTION_TOKEN` in `flask-server/.env`, and enter the page
> IDs in the app. The token is never sent to the browser.

## Configuration

All configuration is environment-based. See
[`flask-server/.env.example`](flask-server/.env.example) and
[`client/.env.example`](client/.env.example).

| Variable | Where | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | server | **Required.** Gemini key for generation |
| `GEMINI_MODEL` | server | Model id (default `gemini-2.5-flash-lite`) |
| `LLM_TEMPERATURE` | server | Generation temperature (default `0.4`) |
| `NOTION_TOKEN` | server | Optional; only for the Notion source |
| `DATABASE_URL` | server | Postgres/Neon URL; unset = local SQLite file |
| `ALLOWED_ORIGINS` | server | Comma-separated CORS allow-list |
| `MAX_QUESTIONS` / `MAX_CONTENT_CHARS` | server | Safety limits |
| `REACT_APP_API_BASE_URL` | client | Backend URL (blank in dev → CRA proxy) |

## Project structure

```
NotionQuizBot/
├── client/                 React front-end
│   └── src/
│       ├── api/             quiz.js + study.js (backend calls)
│       ├── components/      Setup, Quizzes, QNA, Progress, Calculators, Nav, …
│       └── classes/, utils/
├── flask-server/           Flask API
│   ├── app.py               quiz routes, CORS, error handling
│   ├── study_routes.py      history / mastery / review / share endpoints
│   ├── db.py, store.py      SQLAlchemy data layer (SQLite dev / Neon prod)
│   ├── config.py            env-based config (no hardcoded secrets)
│   ├── providers/           LLM provider interface + Gemini implementation
│   ├── quiz/                prompt building, schema, validation, de-dup
│   ├── sources/             pdf.py (PyMuPDF), notion.py (notion-client)
│   ├── scripts/             seed.py (demo), eval_quiz.py (quality gate)
│   └── tests/               schema, PDF, API, and study tests (20)
├── sample/                 generic study material (.md + .pdf) for a no-setup demo
├── docker-compose.yml      one-command local stack
├── Makefile                common tasks
└── DEPLOY.md               deployment notes (Vercel + Render/Railway)
```

## Tests & quality gate

```bash
make test     # backend test suite (schema, PDF parser, API) — no key needed
make eval     # generates from the sample and checks the output (needs GEMINI_API_KEY)
```

The tests use a stub LLM provider, so they run offline. CI (GitHub Actions) runs
the backend lint + tests and the frontend lint + build on every push and PR.

## Deployment

The app is deployment-ready (not deployed). Frontend → Vercel, backend →
Render/Railway, connected via CORS. Full step-by-step instructions, including
the complete environment-variable list, are in **[DEPLOY.md](DEPLOY.md)**.

## License

[MIT](LICENSE)
