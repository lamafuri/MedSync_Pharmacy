# MedSync Pharmacist Portal - Backend

Express.js backend server for the MedSync Pharmacist Portal (Website B).

## Features

- **Authentication**: Registration, login, email verification, password reset with OTP
- **Patient Management**: Link patients via QR token, view patient medicine stock levels
- **Offer System**: Create and send offers via email, SMS, and in-app notifications
- **AI-Powered Offers**: Generate offer templates using Anthropic Claude (premium feature)
- **Analytics**: Track offer performance and patient engagement (premium feature)
- **Notifications**: Real-time alerts for low stock and offer updates
- **Cron Jobs**: Daily low stock alerts at 9:00 AM NPT
- **Premium Subscription**: Free and premium tiers with feature gating

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose 9
- **Authentication**: JWT with bcryptjs
- **Email**: Nodemailer
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **Scheduled Tasks**: node-cron
- **AI**: Anthropic Claude API
- **File Storage**: Cloudinary
- **Module System**: ESM (import/export)

## Installation

```bash
cd server-pharmacist
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/medsync
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5174
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ANTHROPIC_API_KEY=your_anthropic_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Database Collections

### Website B (Pharmacist Portal) - Read/Write
- `Pharmacist` - Pharmacist accounts
- `Offer` - Marketing offers sent to patients
- `PatientLink` - Links between pharmacists and patients
- `Notification` - In-app notifications

### Website A (Patient App) - Read Only
- `Patient` - Patient profiles
- `Medicine` - Patient medicine inventory
- `User` - User accounts

## API Routes

### Authentication (`/api/auth`)
- `POST /register` - Register new pharmacist
- `POST /login` - Login pharmacist
- `POST /verify-email` - Verify email with OTP
- `POST /send-verify-otp` - Resend verification OTP
- `POST /forgot-password/request-otp` - Request password reset OTP
- `POST /forgot-password/reset` - Reset password with OTP
- `GET /me` - Get pharmacist profile (protected)
- `PUT /me` - Update pharmacist profile (protected)
- `PUT /me/password` - Change password (protected)
- `POST /upgrade` - Upgrade to premium (protected)

### Dashboard (`/api/dashboard`)
- `GET /patients` - Get all linked patients with medicines (protected)
- `POST /patients/link` - Link patient via QR token (protected)
- `DELETE /patients/:patientId/unlink` - Unlink patient (protected)
- `PUT /patients/:patientId/contact` - Update patient contact info (protected)

### Offers (`/api/offers`)
- `POST /` - Create and send offer (protected)
- `GET /` - Get offers with pagination (protected)
- `DELETE /:id` - Delete offer (protected)
- `POST /generate-template` - Generate AI offer template (protected, premium)
- `GET /analytics` - Get offer analytics (protected, premium)

### Notifications (`/api/notifications`)
- `GET /` - Get notifications (protected)
- `PUT /:id/read` - Mark notification as read (protected)
- `PUT /read-all` - Mark all notifications as read (protected)

## Stock Status Logic

```
dailyUsage = frequencyPerDay * dosePerIntake
daysLeft = floor(currentStock / dailyUsage)

- Red: daysLeft <= 3
- Amber: daysLeft <= refillThreshold (default 7)
- Green: daysLeft > refillThreshold
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server runs on port 5001 by default.

## Cron Jobs

The low stock alert cron job runs daily at 3:15 UTC (9:00 AM NPT). It checks all linked patients' medicines and creates notifications for pharmacists when stock is low (red or amber status).

## Security

- Passwords are hashed with bcryptjs
- JWT tokens for authentication
- Rate limiting on sensitive endpoints
- Input validation with express-validator
- CORS configured for frontend origin
