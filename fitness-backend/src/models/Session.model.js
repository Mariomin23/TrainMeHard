import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'cancelled', 'disputed'],
    default: 'pending',
  },
  sessionPrice: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  professionalPayout: { type: Number, required: true },
  stripePaymentIntentId: { type: String },
  scheduledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Session', sessionSchema);
