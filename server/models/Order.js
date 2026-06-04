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

    status: {
      type: String,
      enum: ['pending', 'priced', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'orders',
    // strict: false allows reading any extra fields Website A stores
    strict: false,
  }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
