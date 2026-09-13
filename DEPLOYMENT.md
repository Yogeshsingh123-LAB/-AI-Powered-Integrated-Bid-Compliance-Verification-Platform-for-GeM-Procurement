# BidVerify — Vercel Production Deployment Guide

## 1. Project Architecture & Deployment Overview

BidVerify consists of a React (Vite) single-page frontend and a FastAPI (Python) backend.

```
USER BROWSER
    │
    ▼
VERCEL FRONTEND (React + Vite)
    │
    ▼
FASTAPI BACKEND (Vercel Serverless Function or Standalone Container)
    │
    ▼
SUPABASE / NEON POSTGRESQL DATABASE
```

---

## 2. Vercel Project Deployment Configurations

### Option A: Standalone Frontend Deployment on Vercel (Recommended for Separate Backend)
If Vercel is configured to deploy the `frontend/` directory as a standalone project:

- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Backend production URL (e.g., `https://bidverify.vercel.app` or `https://api-bidverify.vercel.app`). Leave empty if using relative Vercel rewrites.

> **CRITICAL BASH COMMAND NOTE**: If **Root Directory** is set to `frontend`, DO NOT set Vercel's custom Build Command to `cd frontend && npm install && npm run build`. Vercel is already inside the `frontend/` directory, so `cd frontend` will fail with `No such file or directory` (Exit Code 1). Set Build Command simply to `npm run build` (or leave default).

---

### Option B: Monorepo Deployment on Vercel (Frontend + Serverless API Functions)
If deploying the root repository with `vercel.json`:

- **Root Directory**: `/` (Repository Root)
- **Root Build Command**: `npm run build` (triggers `npm run build --prefix frontend` via root `package.json`)
- **Output Directory**: `frontend/dist`
- **Vercel Monorepo Manifest (`vercel.json`)**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "api/index.py" },
    { "src": "/health", "dest": "api/index.py" },
    { "src": "/assets/(.*)", "dest": "frontend/assets/$1" },
    { "src": "/(.*)", "dest": "frontend/$1" }
  ]
}
```

---

## 3. Environment Variables Reference

### Frontend Environment Variables (Public / Client-Safe Only)
Set in Vercel Project Settings for the frontend build:

| Variable Name | Purpose | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for FastAPI backend requests | `https://bidverify.vercel.app` (or empty for same-origin) |

> **SECURITY RULE**: NEVER place secrets (`DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, database passwords) into `VITE_` variables. All `VITE_` variables are bundled into the client-side JavaScript.

### Backend Environment Variables (Server-Side Only)
Set in Serverless / Backend Hosting Platform (Vercel Serverless / Railway / Render):

| Variable Name | Purpose | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Managed PostgreSQL (Supabase/Neon) connection string | `postgresql://neondb_owner:password@host/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT token signing | `production_super_secret_jwt_key_sih_2026_gem_procurement` |
| `CORS_ORIGINS` | Allowed frontend origin domains | `https://bidverify.vercel.app,http://localhost:5173` |
| `ENVIRONMENT` | Application execution environment | `production` |

---

## 4. Local Build & Test Verification

Run from workspace root:
```bash
# Test root build delegation
npm run build
```

Run from `frontend/` directory:
```bash
cd frontend
npm install
npm run build
npm test
```

- **Build Output**: `frontend/dist/`
- **Exit Code**: `0`

---

## 5. Final Status Checklist

- VERCEL BUILD: **PASS**
- FRONTEND BUILD: **PASS**
- FRONTEND DEPLOYMENT: **PASS**
- BACKEND CONNECTION: **PASS**
