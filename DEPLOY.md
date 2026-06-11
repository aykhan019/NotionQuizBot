# Deployment notes

This project is split so each half deploys where it's cheapest and simplest:

- **Frontend (React build)** → Vercel (static hosting)
- **Backend (Flask API)** → Render or Railway (a small web service)

Nothing here deploys automatically; these are the steps to do it by hand.

---

## 1. Backend → Render (or Railway)

The backend is a standard Flask app served by Gunicorn. There's already a
`flask-server/Dockerfile`, so you can deploy it as a Docker service, or as a
plain Python service with the commands below.

**Render — as a Python web service**

| Setting | Value |
| --- | --- |
| Root directory | `flask-server` |
| Build command | `pip install -r requirements.txt` |
| Start command | `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app` |

**Environment variables (backend)**

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | ✅ | From https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | – | Defaults to `gemini-2.5-flash-lite` |
| `LLM_TEMPERATURE` | – | Defaults to `0.4` |
| `LLM_MAX_RETRIES` | – | Defaults to `1` |
| `NOTION_TOKEN` | – | Only for the Notion source |
| `DATABASE_URL` | ✅ | Neon Postgres connection string (see step 1a). If unset, falls back to a local SQLite file — fine for a demo, but it won't persist on most platforms. |
| `ALLOWED_ORIGINS` | ✅ | Your frontend URL, e.g. `https://your-app.vercel.app` |
| `MAX_QUESTIONS` | – | Defaults to `20` |
| `MAX_CONTENT_CHARS` | – | Defaults to `24000` |

> `PORT` is provided by the platform; the start command above reads `$PORT`.

After it deploys, note the backend URL, e.g. `https://notionquizbot.onrender.com`.

### 1a. Database → Neon (free Postgres)

History, topic mastery, the spaced-review queue, and shareable quizzes are
stored in Postgres. [Neon](https://neon.tech) gives a free, serverless Postgres:

1. Create a Neon project; copy the connection string (looks like
   `postgresql://user:pass@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`).
2. Set it as `DATABASE_URL` on the backend. You can paste Neon's string as-is —
   the app upgrades `postgresql://` to the `postgresql+psycopg://` driver and
   creates its tables automatically on first boot.

> Locally you don't need Neon at all: leave `DATABASE_URL` unset and the app uses
> a SQLite file (`quizbot.db`).

Railway is equivalent: point it at `flask-server`, set the same env vars, and
use the same Gunicorn start command (or the Dockerfile).

---

## 2. Frontend → Vercel

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Framework preset | Create React App |
| Build command | `npm run build` |
| Output directory | `build` |

**Environment variable (frontend)**

| Variable | Required | Notes |
| --- | --- | --- |
| `REACT_APP_API_BASE_URL` | ✅ | The backend URL from step 1 (no trailing slash) |

This value is baked in at build time, so set it **before** building. If you
change the backend URL later, trigger a fresh build.

---

## 3. Connect them (CORS)

The backend only accepts browser requests from origins listed in
`ALLOWED_ORIGINS`. After both are deployed:

1. Set the backend's `ALLOWED_ORIGINS` to the exact frontend origin
   (e.g. `https://your-app.vercel.app`). Comma-separate multiple origins.
2. Set the frontend's `REACT_APP_API_BASE_URL` to the backend URL and rebuild.

A quick check: open the deployed frontend, generate a quiz, and confirm there
are no CORS errors in the browser console. You can also hit
`GET https://<backend>/api/health` directly — it reports the model and whether
the keys are configured.

---

## 4. Local "production-like" run with Docker

To run the whole stack the way it deploys, without installing Node/Python:

```bash
cp .env.example .env        # add your GEMINI_API_KEY
docker compose up --build
```

- Client → http://localhost:3000
- Server → http://localhost:5000
