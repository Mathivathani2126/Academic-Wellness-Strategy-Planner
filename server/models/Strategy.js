import mongoose from 'mongoose';

const strategySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, default: 'My Strategy' },
  studyHours: { type: Number, required: true },
  sleepHours: { type: Number, required: true },
  subjects: [String],
  goals: [String],
  mode: { type: String, default: 'Balanced' },
  examFrequency: { type: String, default: 'Medium' },
  productivityPattern: { type: String, default: 'Morning' },
  stressLevel: { type: String, default: 'Moderate' },
  wellnessScore: { type: Number, default: 100 },
  advice: { type: mongoose.Schema.Types.Mixed }, // JSON generated strategy
}, { timestamps: true });

export default mongoose.model('Strategy', strategySchema);
