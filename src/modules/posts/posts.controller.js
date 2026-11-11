/** Adapts post publishing and listing to HTTP. */
export function createPostsController(posts) {
  return {
    add: async (req, res) =>
      res.status(201).json(await posts.add(req.user._id, req.input.body)),
    listByEmail: async (req, res) =>
      res.json(
        await posts.listByAuthor(req.input.query.email, req.input.query, true),
      ),
    listByAuthor: async (req, res) =>
      res.json(await posts.listByAuthor(req.input.params.id, req.input.query)),
  };
}
