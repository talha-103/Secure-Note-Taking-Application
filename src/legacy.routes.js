import express from 'express';
import mongoose from 'mongoose';
import { User, Note, Post } from '../models.js';
import { hashPassword } from './modules/auth/password.js';
import { requireAuth } from './middleware/requireAuth.js';
import { requireRole } from './middleware/requireRole.js';

/** Preserves existing feature routes while their modules are migrated. */
export function createLegacyRouter(auth) {
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
  function email(value) {
    const normalized = string(value, 'email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      fail(400, 'Invalid email');
    return normalized;
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
  async function userFields(body, partial = false, allowRole = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body))
      fail(400, 'Expected an object');
    const fields = {};
    if (!partial || body.email !== undefined) fields.email = email(body.email);
    if (!partial || body.password !== undefined) {
      fields.passwordHash = await hashPassword(
        string(body.password, 'password', 256, 8, false),
      );
    }
    if (body.interests !== undefined) {
      if (!Array.isArray(body.interests) || body.interests.length > 25)
        fail(400, 'Invalid interests');
      fields.interests = [
        ...new Set(
          body.interests.map((value) =>
            string(value, 'interest', 80).toLowerCase(),
          ),
        ),
      ];
    }
    if (allowRole && body.role !== undefined) {
      if (!['user', 'admin'].includes(body.role)) fail(400, 'Invalid role');
      fields.role = body.role;
    }
    return fields;
  }
  function publicUser(user) {
    const { _id, email, role, interests } = user;
    return { _id, email, role, interests };
  }
  function contentFields(body) {
    return {
      title: string(body?.title, 'title', 200),
      content: string(body?.content ?? '', 'content', 20000, 0, false),
    };
  }
  api.get('/users/:id/posts', async (req, res) => {
    const options = paging(req);
    const [result] = await User.aggregate([
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
  api.get('/me', (req, res) => res.json(publicUser(req.user)));
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
  api.get('/admin/users', (req, res) =>
    list(req, res, User.find().select('email role interests')),
  );
  api.post('/admin/users', async (req, res) => {
    res
      .status(201)
      .json(
        publicUser(await User.create(await userFields(req.body, false, true))),
      );
  });
  api.get('/admin/users/:id', async (req, res) => {
    const user = await User.findById(id(req.params.id));
    if (!user) fail(404, 'User not found');
    res.json(publicUser(user));
  });
  api.patch('/admin/users/:id', async (req, res) => {
    const userId = id(req.params.id);
    const fields = await userFields(req.body, true, true);
    if (req.user._id.equals(userId) && fields.role === 'user')
      fail(400, 'You cannot demote yourself');
    if (!Object.keys(fields).length) fail(400, 'No changes supplied');
    const user = await User.findByIdAndUpdate(userId, fields, {
      new: true,
      runValidators: true,
    });
    if (!user) fail(404, 'User not found');
    res.json(publicUser(user));
  });
  api.delete('/admin/users/:id', async (req, res) => {
    const userId = id(req.params.id);
    if (req.user._id.equals(userId)) fail(400, 'You cannot delete yourself');
    if (!(await User.findByIdAndDelete(userId))) fail(404, 'User not found');
    res.sendStatus(204);
  });
  api.get('/admin/interests', async (req, res) => {
    const options = paging(req);
    const items = await User.aggregate([
      { $sort: { _id: 1 } },
      { $project: { interests: 1, email: 1 } },
      { $unwind: '$interests' },
      {
        $group: {
          _id: '$interests',
          users: { $push: { _id: '$_id', email: '$email' } },
        },
      },
      { $sort: { _id: 1 } },
      { $skip: options.skip },
      { $limit: options.limit + 1 },
    ]);
    paged(res, items, options);
  });
  return api;
}
