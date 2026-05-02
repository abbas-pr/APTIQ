# MERN Stack Quiz Web Application

Full-stack quiz app with **User** and **Admin** roles, JWT authentication, timed MCQ quizzes, and a **Weekly Contest** with leaderboard.

## Stack

- **MongoDB** + **Mongoose**
- **Express** REST API
- **React** 18 (functional components + hooks) + **Vite**
- **Tailwind CSS** for responsive UI
- **JWT** (`Bearer` token) for auth

## Project structure

```
.
├── server/                 # Node + Express API
│   ├── index.js            # App entry, Mongo connect, routes
│   ├── models/             # User, Quiz, Question, Attempt, Leaderboard, Settings
│   ├── routes/             # auth, quiz, attempt, leaderboard, admin
│   ├── middleware/         # JWT auth + admin guard
│   ├── utils/              # Settings helper
│   ├── scripts/seedAdmin.js
│   └── .env.example
├── client/                 # React SPA
│   ├── src/
│   │   ├── api/client.js   # Axios instance + auth header
│   │   ├── context/        # AuthContext
│   │   ├── components/     # Layout, ProtectedRoute
│   │   └── pages/          # All screens
│   └── .env.example
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally, or a MongoDB Atlas URI

## Setup and run

### 1. Database

Start MongoDB (example local):

```bash
# Windows (if installed as a service it may already run)
# Or use Atlas and copy the connection string
```

### 2. Backend

```bash
cd server
copy .env.example .env
# Edit .env: MONGO_URI, JWT_SECRET, CLIENT_URL, optional ADMIN_EMAIL / ADMIN_PASSWORD
npm install
npm run seed
npm run dev
```

The API listens on `http://localhost:5000` by default. `npm run seed` creates the first **admin** user (skipped if that email already exists).

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend during development.

### 4. Production build (client)

```bash
cd client
npm run build
```

Serve the `client/dist` folder with any static host and set `VITE_API_URL` to your API base (e.g. `https://api.example.com/api`) before building, or configure the same host to reverse-proxy `/api`.

## API overview

| Area | Method | Path | Notes |
|------|--------|------|--------|
| Auth | POST | `/api/auth/register` | Creates `user` role |
| Auth | POST | `/api/auth/login` | Users only |
| Auth | POST | `/api/auth/admin/login` | Admins only |
| Auth | GET | `/api/auth/me` | Bearer token |
| Quizzes | GET | `/api/quizzes` | User: published list |
| Quizzes | GET | `/api/quizzes/:id` | Questions **without** correct answers |
| Attempts | POST | `/api/attempts/submit` | Body: `quizId`, `answers`, `timeTakenSeconds` |
| Attempts | GET | `/api/attempts/:id` | Result detail |
| Leaderboard | GET | `/api/leaderboard` | Weekly contest top users |
| Admin | * | `/api/admin/*` | JWT + `role: admin` |

Admin quiz CRUD: `GET/POST /api/admin/quizzes`, `GET/PUT/DELETE /api/admin/quizzes/:id`. Weekly controls: `GET/PATCH /api/admin/settings`, `DELETE /api/admin/leaderboard`.

## Weekly contest flow

1. Admin creates a quiz, checks **Weekly contest quiz**, and saves.
2. Admin opens the dashboard, selects that quiz under **Active weekly quiz**, and keeps **Weekly contest** enabled.
3. Users see that quiz once in their list; they can submit **once**; scores appear on the leaderboard (sorted by score, then time).
4. Admin can **disable** the contest or **reset leaderboard** for a new week.

## Security notes

- Change `JWT_SECRET` and admin password in production.
- Use HTTPS in production and restrict CORS to your real frontend origin (`CLIENT_URL`).

---

## Deployment (production)

You deploy **three pieces**: MongoDB (hosted), **Express API**, and the **Vite static frontend**. Typical flow: Atlas → API on a Node host → frontend on a static host (or all behind one domain with a reverse proxy).

### 1. MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Database Access: create a database user (username + password).
3. Network Access: add `0.0.0.0/0` for a quick test, or restrict to your API host IPs in production.
4. Connect → Drivers → copy the **connection string**, replace `<password>`, and set it as **`MONGO_URI`** on the server (include the database name in the path, e.g. `...mongodb.net/quiz-app?retryWrites=true&w=majority`).

### 2. Deploy the API (Node + Express)

Use any Node host (examples: [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io), [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)).

- **Root directory**: `server` (if the repo contains both `client` and `server`).
- **Build command**: `npm install` (no build step required).
- **Start command**: `npm start` (runs `node index.js`).
- **Environment variables** (set in the host’s dashboard):

| Variable | Example | Notes |
|----------|---------|--------|
| `MONGO_URI` | `mongodb+srv://...` | From Atlas |
| `JWT_SECRET` | long random string | Required; never commit |
| `CLIENT_URL` | `https://your-app.vercel.app` | **Exact** frontend origin (scheme + host, no trailing path) |
| `PORT` | often injected by host | Many platforms set `PORT` automatically; your code already uses `process.env.PORT` |

After deploy, open `https://<your-api-host>/api/health` and confirm `mongoConnected` is true.

**First admin on production**: from your machine (with Atlas URI in `.env`), run `npm run seed` in `server`, or promote a user in Atlas Data Explorer (`users` collection → set `role` to `admin`). Passwords must be **bcrypt** hashes if you insert manually—seeding from the script is easier.

### 3. Build and deploy the frontend (React / Vite)

The browser must call your **public API URL**. At **build time**, set:

```bash
cd client
set VITE_API_URL=https://your-api.onrender.com
npm run build
```

On Linux/macOS use `export VITE_API_URL=...` instead of `set`.  
`client.js` appends `/api` if the value has no `/api` suffix, so `https://your-api.onrender.com` becomes `https://your-api.onrender.com/api`.

Upload **`client/dist`** to a static host ([Vercel](https://vercel.com), [Netlify](https://www.netlify.com), [Cloudflare Pages](https://pages.cloudflare.com), S3 + CloudFront, etc.), or serve it from the same machine as nginx/Apache.

**Vercel / Netlify**: connect the repo, set root to `client`, build command `npm run build`, output directory `dist`, and add environment variable **`VITE_API_URL`** = your API origin (no trailing slash).

### 4. CORS

The API only allows the origin in **`CLIENT_URL`**. After you know your live frontend URL, set `CLIENT_URL` on the server to that exact value (e.g. `https://quiz-app.vercel.app`) and **redeploy** the API. If you use both `www` and bare domain, pick one for the app or extend the server to allow multiple origins (not configured by default).

### 5. Same domain (optional, advanced)

If you put the API under `https://example.com/api` and the SPA at `https://example.com` via one reverse proxy, you can build the client with **`VITE_API_URL`** empty or use a relative base so requests go to `/api` on the same host—then set **`CLIENT_URL`** to `https://example.com`.

### Checklist

- [ ] Atlas cluster + `MONGO_URI` on API
- [ ] Strong `JWT_SECRET` on API
- [ ] `CLIENT_URL` matches live frontend origin
- [ ] `VITE_API_URL` set **before** `npm run build` on client
- [ ] Admin user created (`npm run seed` or DB promotion)
- [ ] HTTPS everywhere in production
