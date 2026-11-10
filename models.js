import mongoose from 'mongoose';
const { Schema } = mongoose;
const options = { timestamps: true, versionKey: false };
const owner = { type: Schema.Types.ObjectId, ref: 'User', required: true };

const note = new Schema(
  {
    owner,
    title: { type: String, required: true },
    content: { type: String, default: '' },
  },
  options,
);
note.index({ owner: 1, _id: -1 });

const post = new Schema(
  {
    author: owner,
    title: { type: String, required: true },
    content: { type: String, default: '' },
  },
  options,
);
post.index({ author: 1, _id: -1 });

export const { Note, Post } = {
  Note: mongoose.model('Note', note),
  Post: mongoose.model('Post', post),
};
