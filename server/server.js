import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { protectPharmacist, requirePremium } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import offerRoutes from './routes/offers.js';
import notificationRoutes from './routes/notifications.js';
import pharmacistLinkRoutes from './routes/pharmacistLinkRoutes.js';
import orderRoutes from './routes/orders.js';
import './cron/lowStockAlerts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Apply protectPharmacist middleware to protected routes
app.use('/api/dashboard', protectPharmacist, dashboardRoutes);
app.use('/api/offers', protectPharmacist, offerRoutes);
app.use('/api/notifications', protectPharmacist, notificationRoutes);
app.use('/api/pharmacist-links', protectPharmacist, pharmacistLinkRoutes);
app.use('/api/orders', protectPharmacist, orderRoutes);

// Apply requirePremium to specific offer routes
app.use('/api/offers/generate-template', protectPharmacist, requirePremium);
app.use('/api/offers/analytics', protectPharmacist, requirePremium);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MedSync Pharmacist Portal API is running' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
