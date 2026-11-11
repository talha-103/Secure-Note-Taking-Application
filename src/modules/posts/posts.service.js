import { Types } from 'mongoose';
import { Post } from './posts.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { pageOffset, pageResult } from '../../utils/paginate.js';

/** Creates post publishing and per-author listing operations. */
export function createPostsService(users, model = Post) {
  return {
    add: (author, fields) => model.create({ ...fields, author }),
    async listAll(options) {
      const [rows, total] = await Promise.all([
        model
          .find()
          .sort({ _id: -1 })
          .skip(pageOffset(options))
          .limit(options.limit)
          .lean(),
        model.countDocuments().hint('_id_'),
      ]);
      if (!rows.length) return pageResult(rows, options, total);
      const ids = [...new Set(rows.map(({ author }) => String(author)))];
      const identities = await users.findIdentities(ids);
      const byId = new Map(
        identities.map(({ _id, name, email }) => [
          String(_id),
          { name, email },
        ]),
      );
      return pageResult(
        rows.map((post) => ({
          ...post,
          authorProfile: byId.get(String(post.author)) ?? null,
        })),
        options,
        total,
      );
    },
    async listByAuthor(author, options, byEmail = false) {
      const [result] = await users.aggregate([
        {
          $match: byEmail
            ? { email: author }
            : { _id: new Types.ObjectId(author) },
        },
        { $project: { _id: 1, name: 1, email: 1 } },
        {
          $lookup: {
            from: model.collection.name,
            localField: '_id',
            foreignField: 'author',
            pipeline: [
              { $sort: { _id: -1 } },
              {
                $facet: {
                  data: [
                    { $skip: pageOffset(options) },
                    { $limit: options.limit },
                  ],
                  count: [{ $count: 'total' }],
                },
              },
            ],
            as: 'posts',
          },
        },
      ]);
      if (!result) throw new ApiError(404, 'User not found');
      const [posts] = result.posts;
      const page = pageResult(
        posts?.data ?? [],
        options,
        posts?.count[0]?.total ?? 0,
      );
      return byEmail
        ? { ...page, author: { name: result.name ?? '', email: result.email } }
        : page;
    },
  };
}
