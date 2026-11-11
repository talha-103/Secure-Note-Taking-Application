import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    mustChangePassword: { type: Boolean, default: false },
    name: { type: String, default: '' },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    interests: [String],
  },
  { timestamps: true, versionKey: false },
);

// Supports exact email lookups during sign-in and enforces account uniqueness.
schema.index({ email: 1 }, { unique: true });
// Supports the initial exact-interest match on the filtered aggregation.
schema.index({ interests: 1 });

export const User = mongoose.model('User', schema);
