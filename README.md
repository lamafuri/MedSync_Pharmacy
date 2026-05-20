# MedSync Pharmacist Portal

Standalone React + Express application for pharmacists to manage patient medications and send marketing offers. Shares the same MongoDB database with the existing patient app (Website A).

## Project Structure

```
MedSync_Pharam_WS/
├── server-pharmacist/          # Express.js Backend (Port 5001)
│   ├── config/                 # Database and Cloudinary config
│   ├── cron/                   # Scheduled tasks
│   ├── middleware/             # Auth and error handling
│   ├── models/                 # Mongoose models
│   │   ├── shared/            # Read-only models from Website A
│   │   └── Pharmacist.js       # Website B models
│   ├── routes/                 # API routes
│   ├── utils/                  # Helper functions
│   ├── server.js               # Entry point
│   └── package.json
│
└── client-pharmacist/          # React Frontend (Port 5174)
    ├── src/
    │   ├── components/         # Reusable components
    │   ├── lib/                # Axios instance
    │   ├── pages/              # Page components
    │   ├── store/              # Zustand state
    │   ├── App.jsx             # Main app
    │   └── main.jsx            # Entry point
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

## Quick Start

### Backend Setup

```bash
cd server-pharmacist
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd client-pharmacist
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

## Database Architecture

### Shared Collections (Website A - Read Only for Website B)
- `Patient` - Patient profiles with QR tokens
- `Medicine` - Patient medicine inventory
- `User` - User accounts

### Website B Collections (Read/Write)
- `Pharmacist` - Pharmacist accounts
- `Offer` - Marketing offers
- `PatientLink` - Pharmacist-patient relationships
- `Notification` - In-app notifications

## Key Features

### For Pharmacists
- **Patient Linking**: Connect with patients via QR token
- **Stock Monitoring**: Real-time medicine stock alerts (red/amber/green)
- **Offer Management**: Create and send offers via email, SMS, in-app
- **AI Templates**: Generate offer content with Claude (premium)
- **Analytics**: Track offer performance (premium)
- **Notifications**: Low stock alerts and offer updates

### Premium Subscription
- AI-powered offer generation
- Advanced analytics dashboard
- Unlimited patient linking
- Priority support

## Stock Status Logic

```
dailyUsage = frequencyPerDay * dosePerIntake
daysLeft = floor(currentStock / dailyUsage)

Red:    daysLeft <= 3
Amber:  daysLeft <= refillThreshold (default 7)
Green:  daysLeft > refillThreshold
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register pharmacist
- POST `/api/auth/login` - Login
- POST `/api/auth/verify-email` - Verify email
- POST `/api/auth/forgot-password/*` - Password reset

### Dashboard
- GET `/api/dashboard/patients` - Get linked patients
- POST `/api/dashboard/patients/link` - Link patient
- DELETE `/api/dashboard/patients/:id/unlink` - Unlink patient

### Offers
- POST `/api/offers` - Create offer
- GET `/api/offers` - List offers
- POST `/api/offers/generate-template` - AI template (premium)
- GET `/api/offers/analytics` - Analytics (premium)

### Notifications
- GET `/api/notifications` - Get notifications
- PUT `/api/notifications/:id/read` - Mark read

## Tech Stack

### Backend
- Express 5, Mongoose 9, JWT, bcryptjs
- Nodemailer, node-cron, express-validator
- Anthropic Claude API, Cloudinary

### Frontend
- React 18, Vite, Tailwind CSS 3
- Zustand, React Router v7
- react-hook-form, zod, axios
- Recharts, Lucide React

## Development

### Backend
```bash
cd server-pharmacist
npm run dev  # Runs on port 5001
```

### Frontend
```bash
cd client-pharmacist
npm run dev  # Runs on port 5174
```

## Cron Jobs

Daily low stock alerts run at 3:15 UTC (9:00 AM NPT).

## Security

- JWT authentication
- bcrypt password hashing
- Rate limiting on sensitive endpoints
- Input validation
- CORS configuration

## Integration Notes

1. Both apps share the same MongoDB URI
2. Website B only reads Patient/Medicine/User collections
3. Website B writes to its own 4 collections
4. Patient linking uses QR tokens from Website A
5. In-app offers create Notification docs for Website A patients

## License

Proprietary - MedSync
