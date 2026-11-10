import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

// Supports the lookup's author equality filter and descending ID sort.
schema.index({ author: 1, _id: -1 });

export const Post = mongoose.model('Post', schema);
