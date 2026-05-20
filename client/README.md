# MedSync Pharmacist Portal - Frontend

React frontend for the MedSync Pharmacist Portal (Website B).

## Features

- **Authentication**: Login, registration, email verification, password reset
- **Dashboard**: Overview of patient stock levels, alerts, and quick actions
- **Patient Management**: Link patients via QR token, view medicine inventory
- **Offer System**: Create offers with AI-powered template generation
- **Analytics**: Visual charts for offer performance (premium)
- **Notifications**: Real-time notification drawer
- **Responsive Design**: Mobile-first with desktop sidebar
- **Premium Features**: AI offers, analytics, unlimited patients

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand with persistence
- **Routing**: React Router v7
- **Forms**: react-hook-form + zod
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## Installation

```bash
cd client-pharmacist
npm install
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5001
```

## Design System

### Colors
- Navy: `#1a2540` (primary)
- Mint: `#0f6e56` (accent)
- Red: `#e24b4a` (error/critical)
- Amber: `#ef9f27` (warning/premium)
- Green: `#1d9e75` (success)
- Background: `#f4f7fb`
- Card: `#ffffff`
- Border: `#dce3ef`
- Muted: `#7c8fa6`

### Typography
- Display/Body: Plus Jakarta Sans
- Alt: Manrope

### Components
- Card radius: 20px
- Button radius: 20px
- Card shadow: `0 2px 16px rgba(15,31,61,0.08)`
- Modal shadow: `0 8px 40px rgba(15,31,61,0.14)`

## Pages

- **Login** (`/login`) - Authentication with OTP verification
- **Dashboard** (`/`) - Patient alerts and quick actions
- **Patients** (`/patients`) - Patient linking and management
- **Offers** (`/offers`) - Offer creation and history
- **Analytics** (`/analytics`) - Performance charts (premium)
- **Profile** (`/profile`) - Account settings and subscription

## Running the App

```bash
# Development
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

The dev server runs on port 5174 by default.

## State Management

Zustand store with localStorage persistence:

```javascript
{
  pharmacist: Pharmacist | null,
  token: string | null,
  login: (pharmacist, token) => void,
  logout: () => void,
  setPharmacist: (pharmacist) => void
}
```

## API Integration

Axios instance with automatic token injection and 401 handling:

```javascript
// Request: Adds Bearer token from localStorage
// Response 401: Auto-logout and redirect to /login
```

## Premium Features

- AI offer generation (Anthropic Claude)
- Advanced analytics dashboard
- Unlimited patient linking
- Priority support

Free users see blurred content with upgrade prompts.

## Responsive Design

- **Desktop**: Fixed sidebar (256px) + top header
- **Mobile**: Sticky top header + bottom navigation
- **Modal**: Bottom sheet on mobile, centered on desktop

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) with ES6+ support.
