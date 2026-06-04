import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    medicineId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true, trim: true },
    strength: { type: String, trim: true },
    unit: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const deliverySchema = new Schema(
  {
    // Delivery service
    partner: {
      type: String,
      enum: ['pathao', 'yango', 'indrive', 'walk_in', 'others', ''],
      default: '',
    },
    partnerLabel: { type: String, trim: true }, // custom label when partner = 'others'

    // Rider / logistics
    trackingId: { type: String, trim: true },
    riderName: { type: String, trim: true },
    riderPhone: { type: String, trim: true },

    // Pricing & timing
    fee: { type: Number, default: 0, min: 0 },
    estimatedTime: { type: String, trim: true }, // e.g. "20-30 min"
    scheduledAt: { type: Date },
    deliveredAt: { type: Date },

    // Status flow: preparing → dispatched → on_the_way → delivered | failed
    status: {
      type: String,
      enum: ['preparing', 'dispatched', 'on_the_way', 'delivered', 'failed', ''],
      default: '',
    },

    notes: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },

    patientName: { type: String, trim: true },
    patientPhone: { type: String, trim: true },
    patientEmail: { type: String, trim: true },

    medicines: [orderItemSchema],

    totalAmount: { type: Number, default: 0, min: 0 },
    pharmacistNotes: { type: String, trim: true },
    pricedAt: { type: Date },

    delivery: { type: deliverySchema, default: () => ({}) },

    status: {
      type: String,
      enum: ['pending', 'priced', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'orders',
    strict: false,
  }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
