import express from 'express';
import mongoose from 'mongoose';
import { Note, Post } from '../models.js';
import { requireAuth } from './middleware/requireAuth.js';
import { requireRole } from './middleware/requireRole.js';

/** Preserves existing feature routes while their modules are migrated. */
export function createLegacyRouter(auth, users) {
  const api = express.Router();
  function fail(status, message) {
    throw Object.assign(new Error(message), { status });
  }
  function string(value, name, max, min = 1, trim = true) {
    if (typeof value !== 'string') fail(400, name + ' must be a string');
    const result = trim ? value.trim() : value;
    if (result.length < min || result.length > max)
      fail(400, 'Invalid ' + name + ' length');
    return result;
  }
  function id(value) {
    if (!mongoose.isObjectIdOrHexString(value)) fail(400, 'Invalid ID');
    return new mongoose.Types.ObjectId(value);
  }
  function paging(req) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 100000 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      fail(400, 'Invalid pagination');
    return { page, limit, skip: (page - 1) * limit };
  }
  function paged(res, items, { page, limit }) {
    res.json({
      items: items.slice(0, limit),
      page,
      limit,
      hasMore: items.length > limit,
    });
  }
  async function list(req, res, query) {
    const pagingOptions = paging(req);
    const { skip, limit } = pagingOptions;
    paged(
      res,
      await query
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .lean(),
      pagingOptions,
    );
  }
  function contentFields(body) {
    return {
      title: string(body?.title, 'title', 200),
      content: string(body?.content ?? '', 'content', 20000, 0, false),
    };
  }
  api.get('/users/:id/posts', async (req, res) => {
    const options = paging(req);
    const [result] = await users.aggregate([
      { $match: { _id: id(req.params.id) } },
      {
        $lookup: {
          from: Post.collection.name,
          localField: '_id',
          foreignField: 'author',
          pipeline: [
            { $sort: { _id: -1 } },
            { $skip: options.skip },
            { $limit: options.limit + 1 },
          ],
          as: 'items',
        },
      },
      { $project: { items: 1 } },
    ]);
    if (!result) fail(404, 'User not found');
    paged(res, result.items, options);
  });
  api.use(requireAuth(auth));
  api.post('/posts', async (req, res) => {
    res
      .status(201)
      .json(
        await Post.create({ ...contentFields(req.body), author: req.user._id }),
      );
  });
  api.get('/notes', (req, res) =>
    list(req, res, Note.find({ owner: req.user._id })),
  );
  api.post('/notes', async (req, res) => {
    res
      .status(201)
      .json(
        await Note.create({ ...contentFields(req.body), owner: req.user._id }),
      );
  });
  api.get('/notes/:id', async (req, res) => {
    const filter = { _id: id(req.params.id) };
    if (req.user.role !== 'admin') filter.owner = req.user._id;
    const note = await Note.findOne(filter);
    if (!note) fail(404, 'Note not found');
    res.json(note);
  });
  api.put('/notes/:id', async (req, res) => {
    const note = await Note.findOneAndUpdate(
      { _id: id(req.params.id), owner: req.user._id },
      contentFields(req.body),
      { new: true },
    );
    if (!note) fail(404, 'Note not found');
    res.json(note);
  });
  api.delete('/notes/:id', async (req, res) => {
    const note = await Note.findOneAndDelete({
      _id: id(req.params.id),
      owner: req.user._id,
    });
    if (!note) fail(404, 'Note not found');
    res.sendStatus(204);
  });
  api.use('/admin', requireRole('admin'));
  api.get('/admin/notes', (req, res) => list(req, res, Note.find()));
  return api;
}
