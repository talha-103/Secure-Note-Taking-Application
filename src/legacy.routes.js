import express from 'express';
import mongoose from 'mongoose';
import { Post } from '../models.js';
import { requireAuth } from './middleware/requireAuth.js';

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
  return api;
}
