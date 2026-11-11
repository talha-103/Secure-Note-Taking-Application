/** Adapts the authentication service to HTTP. */
export function createAuthController(auth) {
  return {
    async register(req, res) {
      res.status(201).json(await auth.register(req.input.body));
    },
    async changeInitialPassword(req, res) {
      res.json(await auth.changeInitialPassword(req.user, req.input.body));
    },
    async login(req, res) {
      res.json(await auth.login(req.input.body));
    },
  };
}
