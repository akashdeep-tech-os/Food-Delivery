# Food Delivery Platform - Complete Deployment Guide

Step-by-step guide to deploy the entire Food Delivery Platform for free using Render, Supabase, and Vercel.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Push to GitHub](#step-1-push-to-github)
4. [Step 2: Create Database on Supabase](#step-2-create-database-on-supabase)
5. [Step 3: Deploy Backend on Render](#step-3-deploy-backend-on-render)
6. [Step 4: Deploy Customer Frontend on Vercel](#step-4-deploy-customer-frontend-on-vercel)
7. [Step 5: Deploy Admin Panel on Vercel](#step-5-deploy-admin-panel-on-vercel)
8. [Step 6: Seed the Database](#step-6-seed-the-database)
9. [Step 7: Update CORS and Verify](#step-7-update-cors-and-verify)
10. [Free Tier Limits](#free-tier-limits)
11. [Troubleshooting](#troubleshooting)

---

## Overview

| Component             | Service  | Free Tier              |
| --------------------- | -------- | ---------------------- |
| Backend (FastAPI)     | Render   | 750 hours/month        |
| Database (PostgreSQL) | Supabase | 500MB, 50k rows        |
| Customer Frontend     | Vercel   | Unlimited static sites |
| Admin Panel           | Vercel   | Unlimited static sites |

**Estimated total cost: $0/month**

---

## Prerequisites

Before you begin, make sure you have:

- A **GitHub account** (free at github.com)
- A **Supabase account** (free at supabase.com)
- A **Render account** (free at render.com)
- A **Vercel account** (free at vercel.com)
- **Git** installed on your computer
- Your project pushed to a GitHub repository

---

## Step 1: Push to GitHub

If your project is not yet on GitHub, push it:

1. Go to github.com and click **New repository**
2. Name it (e.g., `food-delivery-platform`), keep it **Public** or **Private**
3. Do NOT initialize with README (you already have files)
4. Click **Create repository**

Then from your project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Create Database on Supabase

### 2.1 Create a new project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Organization**: Select or create one
   - **Project name**: `food-delivery-db`
   - **Database password**: Create a strong password and **save it somewhere safe**
   - **Region**: Choose the one closest to your users
4. Click **Create new project**
5. Wait 1-2 minutes for the project to be created

### 2.2 Get your connection string

1. In your Supabase project dashboard, go to **Settings** (gear icon) > **Database**
2. Scroll down to **Connection string**
3. Select **URI** format
4. Copy the full connection string. It looks like:

```
postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:6543/postgres

```

5. **Save this string** — you will need it in Step 3

> **Important:** Make sure you use the **Pooler** connection string (port 6543), not the direct connection (port 5432). The pooler is required for Render and Vercel since they use external connections.

### 2.3 Disable SSL requirement (if connection fails)

If you get SSL errors later, in the Supabase SQL Editor run:

```sql
ALTER SYSTEM SET ssl = off;
SELECT pg_reload_conf();
```

> Note: Supabase usually handles SSL automatically. Only do this if you face connection issues.

---

## Step 3: Deploy Backend on Render

### 3.1 Create a new Web Service

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **New +** > **Web Service**
3. Connect your GitHub repository
4. Select your `food-delivery` repository

### 3.2 Configure the service

Fill in these settings:

| Field             | Value                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| **Name**          | `food-delivery-backend`                                                 |
| **Region**        | `Oregon (US West)` or closest to you                                    |
| **Branch**        | `main`                                                                  |
| **Runtime**       | `Python 3`                                                              |
| **Build Command** | `cd backend && pip install -r requirements.txt && alembic upgrade head` |
| **Start Command** | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`        |

### 3.3 Add environment variables

Click **Advanced** > **Add Environment Variable** and add these:

| Key                           | Value                                                                  |
| ----------------------------- | ---------------------------------------------------------------------- |
| `APP_ENV`                     | `production`                                                           |
| `DATABASE_URL`                | _(paste your Supabase connection string from Step 2.2)_                |
| `SECRET_KEY`                  | _(generate a strong key — see below)_                                  |
| `ALGORITHM`                   | `HS256`                                                                |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60`                                                                   |
| `UPLOAD_DIR`                  | `uploads`                                                              |
| `CORS_ORIGINS`                | `["https://YOUR_FRONTEND.vercel.app","https://YOUR_ADMIN.vercel.app"]` |

**To generate a strong SECRET_KEY**, run this in your terminal:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Or use any random string of 64+ characters.

> **Important:** Replace `YOUR_FRONTEND.vercel.app` and `YOUR_ADMIN.vercel.app` with your actual Vercel URLs. You can update these later in Step 7.

### 3.4 Create the service

1. Click **Create Web Service**
2. Render will start building and deploying
3. Wait for the build to complete (2-5 minutes)
4. Once live, your backend URL will be something like:
   ```
   https://food-delivery-backend.onrender.com
   ```
5. **Save this URL**

### 3.5 Verify the backend

Open these URLs in your browser:

```
https://food-delivery-backend.onrender.com/api/health
https://food-delivery-backend.onrender.com/docs
```

- `/api/health` should return `{"status":"ready","version":"1.0.0"}`
- `/docs` should show the Swagger API documentation

> **Note:** Render free tier spins down after 15 minutes of inactivity. The first request after idle takes 30-60 seconds. This is normal for free tier.

---

## Step 4: Deploy Customer Frontend on Vercel

### 4.1 Important: Update frontend for production

The frontend uses `baseURL: '/api'` which works with the Vite dev proxy. For production on Vercel, you need to configure rewrites so API calls go to your Render backend.

Create a new file `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://food-delivery-backend.onrender.com/api/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://food-delivery-backend.onrender.com/uploads/:path*"
    }
  ]
}
```

> Replace `food-delivery-backend.onrender.com` with your actual Render URL.

### 4.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New...** > **Project**
3. Import your GitHub repository
4. Vercel will detect it's a monorepo. Configure like this:

| Field                | Value           |
| -------------------- | --------------- |
| **Framework Preset** | `Vite`          |
| **Root Directory**   | `frontend`      |
| **Build Command**    | `npm run build` |
| **Output Directory** | `dist`          |

5. Click **Deploy**
6. Wait for deployment (1-2 minutes)
7. Once done, Vercel gives you a URL like:
   ```
   https://food-delivery-frontend.vercel.app
   ```
8. **Save this URL**

### 4.3 Verify the frontend

Visit your Vercel URL. The site should load. Try:

- Browsing the menu (should show food items from your API)
- If no items appear, the database needs seeding (Step 6)

---

## Step 5: Deploy Admin Panel on Vercel

### 5.1 Important: Update admin for production

Same as the frontend — create a `admin/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://food-delivery-backend.onrender.com/api/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://food-delivery-backend.onrender.com/uploads/:path*"
    }
  ]
}
```

> Replace `food-delivery-backend.onrender.com` with your actual Render URL.

### 5.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New...** > **Project**
3. Import your GitHub repository (same repo)
4. Configure:

| Field                | Value           |
| -------------------- | --------------- |
| **Framework Preset** | `Vite`          |
| **Root Directory**   | `admin`         |
| **Build Command**    | `npm run build` |
| **Output Directory** | `dist`          |

5. Click **Deploy**
6. Once done, your admin URL will be like:
   ```
   https://food-delivery-admin.vercel.app
   ```
7. **Save this URL**

### 5.3 Verify the admin panel

Visit your admin Vercel URL. You should see the login page. Log in with:

- **Email:** `admin@fooddelivery.com`
- **Password:** `admin123`

> If login fails, the database needs seeding (Step 6).

---

## Step 6: Seed the Database

You need to run the seed script once to create the admin user, categories, and sample food items.

### Option A: Use Render Shell (Easiest)

1. Go to your Render dashboard > **food-delivery-backend** service
2. Click **Shell** tab (left sidebar)
3. Run these commands in the shell:

```bash
cd backend
python seed.py
```

You should see:

```
Admin user created: admin@fooddelivery.com / admin123
Seed completed successfully!
Categories: 8
Food items: 32
```

### Option B: Add as a Render Job

If Shell doesn't work:

1. In Render dashboard, go to your backend service
2. Click **Manual Deploy** > **Deploy latest commit**
3. After deployment, the build command already runs `alembic upgrade head`
4. You can add `&& python seed.py` to the build command temporarily

### Option C: Run locally against Supabase

1. Update your local `backend/.env` with your Supabase DATABASE_URL
2. Run locally:

```bash
cd backend
python seed.py
```

---

## Step 7: Update CORS and Verify

### 7.1 Update CORS_ORIGINS on Render

Once your frontends are deployed, update the CORS_ORIGINS on Render:

1. Go to Render dashboard > **food-delivery-backend** > **Environment** tab
2. Update `CORS_ORIGINS` with your actual Vercel URLs:

```
["https://food-delivery-frontend.vercel.app","https://food-delivery-admin.vercel.app"]
```

3. Save — Render will auto-redeploy

### 7.2 Update vercel.json files

Make sure both `frontend/vercel.json` and `admin/vercel.json` point to your actual Render backend URL.

### 7.3 Push changes to GitHub

After creating the `vercel.json` files and updating CORS, push to GitHub:

```bash
git add .
git commit -m "Add Vercel config and update CORS for production"
git push
```

Vercel will auto-redeploy both frontends.

### 7.4 Final verification

Test the full flow:

1. Visit your **Customer Frontend** (Vercel URL)
2. You should see food items and categories
3. Register a new account
4. Add items to cart
5. Place an order
6. Visit your **Admin Panel** (Vercel URL)
7. Log in with `admin@fooddelivery.com` / `admin123`
8. Check the Dashboard — your order should appear
9. Update the order status

---

## Free Tier Limits

| Service      | Free Tier Limit                               | What Happens                                   |
| ------------ | --------------------------------------------- | ---------------------------------------------- |
| **Render**   | 750 hours/month, spins down after 15 min idle | First request after idle takes 30-60s          |
| **Supabase** | 500MB database, 50k monthly active users      | Pauses after 7 days of inactivity (can resume) |
| **Vercel**   | 100GB bandwidth/month, unlimited sites        | Hard limit, no spin-down                       |

### Tips to stay within free tier

- **Render spin-down**: Visit your backend once every 14 days to keep Supabase active
- **Supabase pause**: If Supabase pauses, go to dashboard and click **Restore project**
- **Vercel**: Free tier is generous — you won't hit limits for a portfolio project

---

## Troubleshooting

### Backend won't start

**Check Render logs:**

1. Go to Render dashboard > your service > **Logs** tab
2. Common issues:
   - `SECRET_KEY` too short — generate a longer key
   - `DATABASE_URL` wrong — make sure you use the Pooler connection string (port 6543)
   - Missing `alembic` in build command

### "CORS error" in browser console

- Make sure `CORS_ORIGINS` on Render includes your exact Vercel URLs
- URLs must match exactly: `https://food-delivery-frontend.vercel.app` (no trailing slash)
- After updating CORS, Render redeploys automatically

### Frontend shows no food items

- Database hasn't been seeded — run `python seed.py` via Render Shell
- Or check if the API is responding: visit `https://your-backend.onrender.com/api/foods`

### Admin login fails

- Database hasn't been seeded
- Or wrong credentials — use `admin@fooddelivery.com` / `admin123`

### "Application failed to respond" on Render

- Check build logs for errors
- Make sure build command is: `cd backend && pip install -r requirements.txt && alembic upgrade head`
- Make sure start command is: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Images not loading

- Uploaded images are stored in the `uploads/` directory on Render's ephemeral filesystem
- They will be lost on redeploy — this is expected on free tier
- For production, use S3 or Cloudinary for image storage

### Vercel 404 on page refresh

- Vercel rewrites should handle this
- If not, create a `vercel.json` in the frontend/admin root with:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Supabase connection refused

- Make sure you're using the **Pooler** connection string (port 6543), not direct (port 5432)
- Check that the database password is correct
- In Supabase dashboard, verify the project is **Active** (not paused)

---

## Quick Reference: Your URLs

After deployment, fill in your actual URLs:

| Service            | URL                                                  |
| ------------------ | ---------------------------------------------------- |
| Backend API        | `https://food-delivery-backend.onrender.com`         |
| API Docs           | `https://food-delivery-backend.onrender.com/docs`    |
| Customer Frontend  | `https://food-delivery-qjuf.vercel.app/`             |
| Admin Panel        | `https://food-delivery-rouge-seven.vercel.app/login` |
| Supabase Dashboard | `https://supabase.com/dashboard`                     |

---

## Post-Deployment Checklist

- [ ] Supabase project created and connection string saved
- [ ] Backend deployed on Render and `/api/health` returns OK
- [ ] Frontend deployed on Vercel and loads correctly
- [ ] Admin panel deployed on Vercel and login works
- [ ] Database seeded with admin user and sample data
- [ ] CORS_ORIGINS updated with actual Vercel URLs
- [ ] `vercel.json` files created for API proxying
- [ ] Full flow tested: register, browse, order, admin management
