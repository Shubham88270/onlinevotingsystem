# 🗳️ VoteChain — Secure Online Voting System

## Tech Stack
- **Frontend:** React 18, Tailwind CSS, Framer Motion, Socket.io-client
- **Backend:** Node.js, Express, MongoDB, Socket.io
- **Auth:** JWT, bcryptjs, OTP via Nodemailer

---

## 🚀 Deployment Guide

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo, set **Root Directory** to `server`
4. Build: `npm install` | Start: `npm start`
5. Add Environment Variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 64-char random hex string |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `CLIENT_URL` | Your Vercel frontend URL |
| `NODE_ENV` | `production` |

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import GitHub repo, set **Root Directory** to `client`
3. Framework: Create React App
4. Add Environment Variable:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | Your Render backend URL |

---

## 🔧 Local Development

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Backend
cd server && npm run dev

# Terminal 3 — Frontend
cd client && npm start
```

Copy `server/.env.example` to `server/.env` and fill in values.

---

## 🔑 First Admin Setup

After deploying, run once to create admin:

```bash
cd server
node createAdmin.js
```

Login: `admin@vote.com` / `Admin@123`
