import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;

    const notifications = await Notification.find({
      recipientId: pharmacistId,
      recipientModel: 'Pharmacist',
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const pharmacistId = req.pharmacist._id;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: pharmacistId,
      recipientModel: 'Pharmacist',
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;

    await Notification.updateMany(
      {
        recipientId: pharmacistId,
        recipientModel: 'Pharmacist',
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
