import { User } from '../models.js';

// The account model moves into the Users module when that module is migrated.
export const accounts = {
  create: (fields) => User.create(fields),
  findCredentials: (email) => User.findOne({ email }).select('+passwordHash'),
  findById: (id) => User.findById(id),
  replacePasswordHash: (_id, passwordHash, replacement) =>
    User.updateOne(
      { _id, passwordHash },
      { $set: { passwordHash: replacement } },
    ),
};
