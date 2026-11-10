import mongoose from 'mongoose';
const { Schema } = mongoose;
const options = { timestamps: true, versionKey: false };
const owner = { type: Schema.Types.ObjectId, ref: 'User', required: true };

const user = new Schema(
  {
    email: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    interests: [String],
  },
  options,
);
user.index({ email: 1 }, { unique: true });

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

export const { User, Note, Post } = {
  User: mongoose.model('User', user),
  Note: mongoose.model('Note', note),
  Post: mongoose.model('Post', post),
};
