# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run both server and client concurrently (from root)
npm run dev

# Server only (port 5001, auto-reload via --watch)
cd server && npm run dev

# Client only (port 5174, Vite)
cd client && npm run dev

# Production build (client)
cd client && npm run build
```

### No test runner or linter is configured in this project.

## Architecture Overview

MedSync Pharmacy is a pharmacist portal (Website B) that **shares a MongoDB database** with a separate patient-facing app (Website A). This dual-app architecture is the most important concept in the codebase:

- **Read-only collections** (written by Website A): `Patient`, `Medicine`, `User` — located in `server/models/shared/`
- **Read/write collections** (owned by Website B): `Pharmacist`, `Offer`, `PatientLink`, `Notification`, `PendingPharmacistRegistration`, `PharmacistInvitation`, `PharmacistLink`

Never mutate data in the shared models.

## Backend (`server/`)

- **Framework**: Express 5 with ES modules (`import/export`)
- **Database**: MongoDB + Mongoose 9
- **Entry point**: `server/server.js`

### Route Structure
| Prefix | File | Purpose |
|--------|------|---------|
| `/api/auth` | `routes/auth.js` | Registration, OTP verification, login, password reset, profile |
| `/api/dashboard` | `routes/dashboard.js` | Patient linking, stock status |
| `/api/offers` | `routes/offers.js` | Offer CRUD, AI template generation |
| `/api/notifications` | `routes/notifications.js` | In-app notification management |
| `/api/pharmacist-link` | `routes/pharmacistLinkRoutes.js` | Pharmacist linking |

### Auth Flow
1. `POST /api/auth/register` → creates `PendingPharmacistRegistration` and sends OTP
2. `POST /api/auth/verify-email` → moves record to `Pharmacist` collection
3. `POST /api/auth/login` → returns JWT (30-day expiry)
4. Protected routes use `middleware/auth.js` which attaches `req.pharmacist`

### Premium Feature Gating
- `requirePremium` middleware in `middleware/auth.js` checks `req.pharmacist.isPremium`
- PIN `1234` bypasses premium check (development/demo)

### Stock Status Logic
```
dailyUsage = medicine.frequencyPerDay * medicine.dosePerIntake
daysLeft   = floor(currentStock / dailyUsage)

Red   → daysLeft <= 3
Amber → daysLeft <= refillThreshold (default 7)
Green → daysLeft > refillThreshold
```

### Cron Job
`cron/lowStockAlerts.js` runs daily at **3:15 UTC (9:00 AM NPT)**. It scans all patient links, computes stock status, and creates low-stock `Notification` documents. Family members linked to the same `userId` are deduplicated to avoid redundant notifications.

### AI Integration
Offer template generation uses **Groq API** (not Anthropic). The env var is `GROQ_API_KEY`.

## Frontend (`client/`)

- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS with custom design tokens (see `tailwind.config.js`)
- **State**: Zustand with localStorage persistence (`client/src/store/authStore.js`)
- **HTTP**: Axios instance at `client/src/lib/axios.js` — automatically injects `Authorization: Bearer <token>` and redirects to `/login` on 401

### Route Layout
All routes except `/login` are wrapped in `ProtectedRoute` + `AppShell`. Analytics (`/analytics`) additionally requires premium.

### Design Tokens (Tailwind)
| Token | Value | Use |
|-------|-------|-----|
| `navy` | `#1a2540` | Primary |
| `mint` | `#0f6e56` | Accent |
| `red` / `amber` / `green` | Status colors | Stock badges |
| Card radius | `20px` | All cards/buttons |

### Premium UX
Non-premium users see blurred content behind a `PremiumGate` component with an upgrade prompt. Premium can be activated via `POST /api/auth/upgrade` with PIN `1234` in development.

## Environment Variables

**Server** (copy `server/.env.example` to `server/.env`):
```
PORT, MONGODB_URI, JWT_SECRET, CLIENT_URL
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS   # Gmail SMTP
GROQ_API_KEY                                  # AI offer generation
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

**Client** (`client/.env`):
```
VITE_API_BASE_URL=http://localhost:5001
```
The Vite proxy (`vite.config.js`) forwards `/api` → `http://localhost:5001` in dev, so `VITE_API_BASE_URL` is mainly needed for production builds.
