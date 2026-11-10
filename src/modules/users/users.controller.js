import { publicUser } from './users.service.js';

/** Adapts account management operations to HTTP. */
export function createUsersController(users) {
  return {
    profile: (req, res) => res.json(publicUser(req.user)),
    list: async (req, res) => res.json(await users.list(req.input.query)),
    add: async (req, res) =>
      res.status(201).json(await users.add(req.input.body)),
    get: async (req, res) => res.json(await users.get(req.input.params.id)),
    update: async (req, res) =>
      res.json(
        await users.update(req.user._id, req.input.params.id, req.input.body),
      ),
    async remove(req, res) {
      await users.remove(req.user._id, req.input.params.id);
      res.sendStatus(204);
    },
    interests: async (req, res) =>
      res.json(await users.interests(req.input.query)),
  };
}
