/** Adapts post publishing and listing to HTTP. */
export function createPostsController(posts) {
  return {
    add: async (req, res) =>
      res.status(201).json(await posts.add(req.user._id, req.input.body)),
    async list(req, res) {
      const { email, ...options } = req.input.query;
      res.json(
        email
          ? await posts.listByAuthor(email, options, true)
          : await posts.listAll(options),
      );
    },
    listByAuthor: async (req, res) =>
      res.json(await posts.listByAuthor(req.input.params.id, req.input.query)),
  };
}
