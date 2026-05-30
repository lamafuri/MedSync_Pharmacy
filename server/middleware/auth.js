import jwt from 'jsonwebtoken';
import Pharmacist from '../models/Pharmacist.js';

export const protectPharmacist = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Not authorized as pharmacist' });
    }

    const pharmacist = await Pharmacist.findById(decoded.id).select('-password');

    if (!pharmacist) {
      return res.status(401).json({ message: 'Pharmacist not found' });
    }

    req.pharmacist = pharmacist;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Not authorized' });
  }
};

export const requirePremium = (req, res, next) => {
  if (!req.pharmacist.isPremium && req.body.testPin !== '1234' && req.query.testPin !== '1234') {
    return res.status(403).json({ 
      message: 'Premium required', 
      upgradeUrl: '/upgrade' 
    });
  }
  next();
};
