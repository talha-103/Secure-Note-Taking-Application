import { User } from './users.model.js';
import { hashPassword } from '../auth/password.js';
import { ApiError } from '../../utils/ApiError.js';
import { pageOffset, pageResult } from '../../utils/paginate.js';

/** Projects the account fields permitted in API responses. */
export function publicUser({
  _id,
  name = '',
  email,
  role,
  interests,
  mustChangePassword = false,
}) {
  return { _id, name, email, role, interests, mustChangePassword };
}

/** Creates account persistence and management operations. */
export function createUsersService(model = User) {
  function found(user) {
    if (!user) throw new ApiError(404, 'User not found');
    return publicUser(user);
  }

  async function accountFields({ password, ...fields }) {
    if (password !== undefined)
      fields.passwordHash = await hashPassword(password);
    return fields;
  }

  return {
    hasAdmin: () => model.exists({ role: 'admin' }),
    create: (fields) => model.create(fields),
    findCredentials: (email) =>
      model.findOne({ email }).select('+passwordHash'),
    findById: (id) => model.findById(id),
    replacePasswordHash: (_id, passwordHash, replacement) =>
      model.updateOne(
        { _id, passwordHash },
        { $set: { passwordHash: replacement } },
      ),
    completePasswordSetup: (_id, passwordHash, credentials) =>
      model.findOneAndUpdate(
        { _id, passwordHash, mustChangePassword: true },
        { $set: { ...credentials, mustChangePassword: false } },
        { new: true },
      ),
    findIdentities: (ids) =>
      model
        .find({ _id: { $in: ids } })
        .select('name email')
        .lean(),
    async list(options) {
      const [data, total] = await Promise.all([
        model
          .find()
          .select('name email role interests')
          .sort({ _id: -1 })
          .skip(pageOffset(options))
          .limit(options.limit)
          .lean(),
        model.countDocuments().hint('_id_'),
      ]);
      return pageResult(data.map(publicUser), options, total);
    },
    async add(fields) {
      return publicUser(await model.create(await accountFields(fields)));
    },
    async get(id) {
      return found(await model.findById(id));
    },
    async update(actorId, id, fields) {
      if (String(actorId) === id.toLowerCase() && fields.role !== undefined) {
        throw new ApiError(400, 'You cannot change your own role');
      }
      return found(
        await model.findByIdAndUpdate(id, await accountFields(fields), {
          new: true,
          runValidators: true,
        }),
      );
    },
    async remove(actorId, id) {
      if (String(actorId) === id.toLowerCase())
        throw new ApiError(400, 'You cannot delete yourself');
      if (!(await model.findByIdAndDelete(id)))
        throw new ApiError(404, 'User not found');
    },
    async interests(options) {
      const { interest, limit } = options;
      const [result] = await model.aggregate([
        ...(interest ? [{ $match: { interests: interest } }] : []),
        { $project: { interests: 1, name: 1, email: 1 } },
        { $unwind: '$interests' },
        ...(interest ? [{ $match: { interests: interest } }] : []),
        {
          $group: {
            _id: '$interests',
            users: { $push: { _id: '$_id', name: '$name', email: '$email' } },
          },
        },
        {
          $facet: {
            data: [
              { $sort: { _id: -1 } },
              { $skip: pageOffset(options) },
              { $limit: limit },
            ],
            count: [{ $count: 'total' }],
          },
        },
      ]);
      return pageResult(
        result?.data ?? [],
        options,
        result?.count?.[0]?.total ?? 0,
      );
    },
    aggregate(pipeline) {
      return model.aggregate(pipeline);
    },
  };
}

export const users = createUsersService();
