import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

// Supports listing and counting one owner's notes in descending ID order.
schema.index({ owner: 1, _id: -1 });

export const Note = mongoose.model('Note', schema);
