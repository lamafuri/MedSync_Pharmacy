import express from 'express';
import { body, validationResult } from 'express-validator';
import Anthropic from '@anthropic-ai/sdk';
import PatientLink from '../models/PatientLink.js';
import Patient from '../models/shared/Patient.js';
import Offer from '../models/Offer.js';
import Notification from '../models/Notification.js';
import { sendOfferEmail } from '../utils/sendEmail.js';

const router = express.Router();

// POST /api/offers
router.post('/', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('offerType').isIn(['discount', 'buy2get1', 'bundle', 'custom']).withMessage('Invalid offer type'),
  body('discountPercent').optional().isInt({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('fullMessage').trim().notEmpty().withMessage('Message is required'),
  body('channels').isArray().withMessage('Channels must be an array'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, medicineName, offerType, discountPercent, title, description, fullMessage, shortMessage, channels, expiresAt } = req.body;
    const pharmacistId = req.pharmacist._id;

    // Verify PatientLink exists
    const patientLink = await PatientLink.findOne({
      pharmacistId,
      patientId,
    });

    if (!patientLink) {
      return res.status(404).json({ message: 'Patient not linked to this pharmacist' });
    }

    // Fetch patient details
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create offer with draft status
    const offer = await Offer.create({
      pharmacistId,
      patientId,
      medicineName,
      offerType,
      discountPercent: discountPercent || 0,
      title,
      description,
      fullMessage,
      shortMessage,
      channels,
      expiresAt: expiresAt || null,
      status: 'draft',
    });

    // Send through each channel
    for (const channel of channels) {
      if (channel === 'email' && patientLink.patientEmail) {
        await sendOfferEmail({
          to: patientLink.patientEmail,
          patientName: patient.name,
          pharmacyName: req.pharmacist.pharmacyName,
          offerTitle: title,
          offerMessage: fullMessage,
          medicineName,
          expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      } else if (channel === 'sms') {
        // SMS stub - console.log for now
        console.log(`SMS sent to ${patientLink.patientPhone}: ${title} - ${shortMessage}`);
      } else if (channel === 'in_app') {
        // Create in-app notification for patient
        await Notification.create({
          recipientId: patientId,
          recipientModel: 'Patient',
          type: 'offer',
          title,
          message: shortMessage || fullMessage,
          offerId: offer._id,
        });
      }
    }

    // Update offer status to sent
    offer.status = 'sent';
    offer.sentAt = new Date();
    await offer.save();

    res.status(201).json(offer);
  } catch (error) {
    next(error);
  }
});

// GET /api/offers
router.get('/', async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;
    const { patientId, status, page = 1, limit = 20 } = req.query;

    const query = { pharmacistId };
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const offers = await Offer.find(query)
      .populate('patientId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Offer.countDocuments(query);

    res.json({
      offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/offers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const pharmacistId = req.pharmacist._id;

    const offer = await Offer.findOne({ _id: id, pharmacistId });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.status === 'draft') {
      // Hard delete draft offers
      await Offer.deleteOne({ _id: id });
    } else {
      // Soft delete sent offers by setting to expired
      offer.status = 'expired';
      await offer.save();
    }

    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/offers/generate-template
router.post('/generate-template', [
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('offerType').isIn(['discount', 'buy2get1', 'bundle', 'custom']).withMessage('Invalid offer type'),
  body('discountPercent').optional().isInt({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { medicineName, offerType, discountPercent } = req.body;
    const pharmacyName = req.pharmacist.pharmacyName;

    if (!req.pharmacist.isPremium) {
      return res.status(403).json({
        message: 'Premium required',
        upgradeUrl: '/upgrade',
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const discountText = offerType === 'discount' ? `${discountPercent}% off` : offerType;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: 'Pharmacy marketing assistant in Nepal. Respond with valid JSON only, no markdown.',
      messages: [
        {
          role: 'user',
          content: `Generate offer for:
Pharmacy: ${pharmacyName}
Medicine: ${medicineName}
Offer: ${discountText}
Return JSON: { title, fullMessage, shortMessage, emailSubject, suggestedDiscount, urgencyLevel, expiryDays, tags }`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return res.status(500).json({ message: 'Failed to parse AI response' });
    }

    const template = JSON.parse(jsonMatch[0]);

    res.json({ template });
  } catch (error) {
    next(error);
  }
});

// GET /api/offers/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;

    if (!req.pharmacist.isPremium) {
      return res.status(403).json({
        message: 'Premium required',
        upgradeUrl: '/upgrade',
      });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const offersThisWeek = await Offer.countDocuments({
      pharmacistId,
      status: 'sent',
      sentAt: { $gte: weekAgo },
    });

    const offersThisMonth = await Offer.countDocuments({
      pharmacistId,
      status: 'sent',
      sentAt: { $gte: monthAgo },
    });

    const totalSent = await Offer.countDocuments({
      pharmacistId,
      status: 'sent',
    });

    const acceptedCount = await Offer.countDocuments({
      pharmacistId,
      status: 'accepted',
    });

    const acceptanceRate = totalSent > 0 ? (acceptedCount / totalSent) * 100 : 0;

    // Top medicines
    const topMedicines = await Offer.aggregate([
      { $match: { pharmacistId } },
      { $group: { _id: '$medicineName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    ]);

    // Offers by type
    const offersByType = await Offer.aggregate([
      { $match: { pharmacistId } },
      { $group: { _id: '$offerType', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
    ]);

    const offersByTypeMap = {};
    offersByType.forEach(item => {
      offersByTypeMap[item.type] = item.count;
    });

    // Patient engagement (last 30 days)
    const patientEngagement = await Offer.aggregate([
      {
        $match: {
          pharmacistId,
          sentAt: { $gte: monthAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$sentAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    res.json({
      offersThisWeek,
      offersThisMonth,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      topMedicines,
      offersByType: offersByTypeMap,
      patientEngagement,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
