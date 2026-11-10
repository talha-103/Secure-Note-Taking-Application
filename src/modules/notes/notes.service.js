import { Note } from './notes.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { pageOffset, pageResult } from '../../utils/paginate.js';

/** Creates note operations with ownership enforced in the database filters. */
export function createNotesService(model = Note) {
  function found(note) {
    if (!note) throw new ApiError(404, 'Note not found');
    return note;
  }

  async function list(filter, options, countIndex) {
    const [data, total] = await Promise.all([
      model
        .find(filter)
        .sort({ _id: -1 })
        .skip(pageOffset(options))
        .limit(options.limit)
        .lean(),
      model.countDocuments(filter).hint(countIndex),
    ]);
    return pageResult(data, options, total);
  }

  return {
    listOwn: (owner, options) =>
      list({ owner }, options, { owner: 1, _id: -1 }),
    listAll: (options) => list({}, options, '_id_'),
    add: (owner, fields) => model.create({ ...fields, owner }),
    get: async (owner, _id) => found(await model.findOne({ _id, owner })),
    update: async (owner, _id, fields) =>
      found(
        await model.findOneAndUpdate({ _id, owner }, fields, {
          new: true,
          runValidators: true,
        }),
      ),
    async remove(owner, _id) {
      found(await model.findOneAndDelete({ _id, owner }));
    },
  };
}

export const notes = createNotesService();
