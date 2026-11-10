/** Adapts note service operations to HTTP. */
export function createNotesController(notes) {
  return {
    listOwn: async (req, res) =>
      res.json(await notes.listOwn(req.user._id, req.input.query)),
    listAll: async (req, res) => res.json(await notes.listAll(req.input.query)),
    add: async (req, res) =>
      res.status(201).json(await notes.add(req.user._id, req.input.body)),
    get: async (req, res) =>
      res.json(await notes.get(req.user._id, req.input.params.id)),
    update: async (req, res) =>
      res.json(
        await notes.update(req.user._id, req.input.params.id, req.input.body),
      ),
    async remove(req, res) {
      await notes.remove(req.user._id, req.input.params.id);
      res.sendStatus(204);
    },
  };
}
