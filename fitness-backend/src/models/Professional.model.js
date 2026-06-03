import mongoose from 'mongoose';

const professionalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    professionalType: {
      type: String,
      enum: ['trainer', 'nutritionist', 'physiotherapist'],
      required: true,
    },
    bio: { type: String, maxlength: 500, default: '' },
    specialties: [{ type: String }],
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    sessionPrice: { type: Number, required: true, min: 0, default: 0 },
    stripeAccountId: { type: String },
    isApproved: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    availability: [{
      day: { type: String, required: true },
      timeSlots: [{ type: String }],
    }],
  },
  { timestamps: true }
);

professionalSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('Professional', professionalSchema);
