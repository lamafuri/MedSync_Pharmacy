import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// GET /api/orders — list all orders, newest first
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const { status } = req.query;

    const filter = status && status !== 'all' ? { status } : {};

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id — single order
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/orders/:id/price — pharmacist sets per-medicine unit prices
// Body: { medicines: [{ name, quantity, unitPrice }], pharmacistNotes, status }
router.put('/:id/price', async (req, res, next) => {
  try {
    const { medicines, pharmacistNotes, status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (Array.isArray(medicines) && medicines.length > 0) {
      order.medicines = medicines.map((m) => ({
        medicineId: m.medicineId,
        name: m.name || '',
        strength: m.strength || '',
        unit: m.unit || '',
        quantity: Number(m.quantity) || 1,
        unitPrice: Math.max(0, Number(m.unitPrice) || 0),
        totalPrice: Math.max(0, (Number(m.unitPrice) || 0) * (Number(m.quantity) || 1)),
      }));

      order.totalAmount = order.medicines.reduce((sum, m) => sum + m.totalPrice, 0);
    }

    if (pharmacistNotes !== undefined) {
      order.pharmacistNotes = pharmacistNotes;
    }

    const validStatuses = ['pending', 'priced', 'confirmed', 'completed', 'cancelled'];
    order.status = validStatuses.includes(status) ? status : 'priced';
    order.pricedAt = new Date();

    await order.save();

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status — update status only
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'priced', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

export default router;
