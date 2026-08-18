# Talent-IQ Deployment Guide

## Architecture

```
Frontend (Vercel) → Backend (Render) → MongoDB Atlas
                  → Wandbox API (code execution)
                  → Groq/Gemini API (AI)
                  → Stream (video/chat)
```

---

## Step 1: MongoDB Atlas (Database)

Your MongoDB Atlas is already set up. Just ensure:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster → **Database Access** → verify your user exists
3. **Network Access** → Add IP Address → `0.0.0.0/0` (Allow access from anywhere)
4. **Connect** → Drivers → Copy the connection string
5. Replace `<password>` with your actual password

Your connection string should look like:
```
mongodb+srv://user:password@cluster.mongodb.net/?appName=TalentIQ
```

---

## Step 2: Backend on Render

### 2.1 Push to GitHub

```bash
cd your-project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/talent-iq.git
git push -u origin main
```

### 2.2 Create Render Account & Service

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `talent-iq-api` |
| **Region** | Oregon (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node src/server.js` |
| **Instance Type** | Free or Starter |

### 2.3 Environment Variables on Render

Go to **Environment** tab and add these:

```env
# ==== App ====
PORT=3000
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app

# ==== Database ====
DB_URL=mongodb+srv://user:password@cluster.mongodb.net/?appName=TalentIQ

# ==== Clerk (authentication) ====
CLERK_PUBLISHABLE_KEY=pk_test_YourKey
CLERK_SECRET_KEY=sk_test_YourSecretKey

# ==== Stream (video + chat) ====
STREAM_API_KEY=your_stream_key
STREAM_API_SECRET=your_stream_secret

# ==== AI / LLM ====
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key

# ==== Inngest ====
INNGEST_EVENT_KEY=your_inngest_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# ==== Codeforces sync ====
ADMIN_EMAILS=your@email.com
```

### 2.4 Deploy

Click **Create Web Service** → Render will build and deploy automatically.

Your backend URL will be: `https://talent-iq-api.onrender.com`

---

## Step 3: Frontend on Vercel

### 3.1 Install Vercel CLI (optional)

```bash
npm i -g vercel
```

### 3.2 Deploy via CLI or Dashboard

**Option A — CLI:**
```bash
cd frontend
vercel
```

**Option B — Dashboard:**
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New** → **Project**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.3 Environment Variables on Vercel

Go to **Settings** → **Environment Variables** and add:

```env
# ==== Clerk ====
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YourKey

# ==== API (your Render backend URL) ====
VITE_API_URL=https://talent-iq-api.onrender.com/api

# ==== Stream ====
VITE_STREAM_API_KEY=your_stream_key
```

### 3.4 Deploy

Click **Deploy** → Vercel builds and deploys automatically.

Your frontend URL will be: `https://talent-iq.vercel.app`

---

## Step 4: Update CORS & Clerk URLs

### 4.1 Update Backend CORS

In Render environment variables, make sure `CLIENT_URL` matches your Vercel URL:
```
CLIENT_URL=https://talent-iq.vercel.app
```

### 4.2 Update Clerk Allowed Origins

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Your application → **Paths**
3. Add your Vercel URL to allowed origins
4. Go to **Webhooks** (if used) → update endpoint URL

### 4.3 Update Stream (if using video)

1. Go to [GetStream Dashboard](https://getstream.io/dashboard)
2. Update allowed origins to include your Vercel URL

---

## Step 5: Verify Deployment

1. Open `https://your-app.vercel.app`
2. Sign up / sign in with Clerk
3. Go to Dashboard
4. Start an AI Interview → verify questions generate
5. Submit an answer → verify evaluation works
6. Check Performance page → should show scores
7. Go to Practice → verify code editor loads

---

## Troubleshooting

### Backend won't start on Render
- Check **Logs** tab in Render dashboard
- Common issues:
  - Missing environment variables
  - MongoDB connection string wrong
  - Port conflict (Render assigns PORT automatically)

### Frontend can't reach backend
- Verify `VITE_API_URL` on Vercel matches your Render URL
- Check Render logs for CORS errors
- Ensure `CLIENT_URL` on Render matches your Vercel URL

### Clerk authentication fails
- Verify `CLERK_PUBLISHABLE_KEY` on Vercel matches your Clerk app
- Verify `CLERK_SECRET_KEY` on Render matches your Clerk app
- Both must be for the same Clerk application

### AI interview questions not generating
- Check Render logs for Groq/Gemini errors
- Verify API keys are correct
- The backend auto-falls back between Groq and Gemini if one is rate-limited

### Code execution fails
- Wandbox API is public and free — no key needed
- If blocked, the frontend `piston.js` handles errors gracefully

---

## Free Tier Limits

| Service | Free Tier | What's Included |
|---------|-----------|-----------------|
| **Vercel** | Hobby | 100GB bandwidth, serverless functions |
| **Render** | Free (spins down after 15min) | 512MB RAM, shared CPU |
| **MongoDB Atlas** | M0 (512MB) | Shared cluster, limited connections |
| **Clerk** | 10,000 MAU | Authentication |
| **Groq** | Free tier | LLM inference |
| **GetStream** | Free tier | Video + chat |

### Important: Render Free Tier
Render free services spin down after 15 minutes of inactivity. First request after idle takes ~30s to wake up. To avoid this:
- Upgrade to Starter ($7/mo) for always-on service
- Or set up a cron ping (e.g., UptimeRobot) to hit `/health` every 10 minutes

---

## Quick Deploy Commands

```bash
# 1. Push to GitHub
git add . && git commit -m "Deploy" && git push

# 2. Deploy frontend (if using CLI)
cd frontend && vercel --prod

# 3. Render auto-deploys from GitHub on push
```

---

## Environment Variable Checklist

### Vercel (Frontend)
- [ ] `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] `VITE_API_URL` (https://your-backend.onrender.com/api)
- [ ] `VITE_STREAM_API_KEY`

### Render (Backend)
- [ ] `PORT` (Render sets this automatically)
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` (https://your-frontend.vercel.app)
- [ ] `DB_URL` (MongoDB connection string)
- [ ] `CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `STREAM_API_KEY`
- [ ] `STREAM_API_SECRET`
- [ ] `GROQ_API_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `INNGEST_EVENT_KEY`
- [ ] `INNGEST_SIGNING_KEY`
- [ ] `ADMIN_EMAILS`
