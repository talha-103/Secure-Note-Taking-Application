import mongoose from 'mongoose';
const { Schema } = mongoose;
const options = { timestamps: true, versionKey: false };
const owner = { type: Schema.Types.ObjectId, ref: 'User', required: true };

const post = new Schema(
  {
    author: owner,
    title: { type: String, required: true },
    content: { type: String, default: '' },
  },
  options,
);
post.index({ author: 1, _id: -1 });

export const Post = mongoose.model('Post', post);
