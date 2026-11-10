# Secure Notes

Secure Notes is an Express REST API with a React client. Users manage their own notes and can browse posts by author after signing in. Admins can also manage users, browse all notes, and view interest groups.

## Run locally

Use Node.js 22.13+ on the 22.x line or Node.js 24+ and a running MongoDB instance. From the repository root, install the locked dependencies.

```sh
npm ci
npm ci --prefix client
```

Copy `.env.example` to `.env`. Set `MONGODB_URI` and use a random secret of at least 32 bytes for `JWT_SECRET`. Generate one with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your shell, then run `npm run seed` to create the initial admin. The seed refuses to overwrite an existing account.

Run `npm run dev` and open <http://localhost:3000>. The client development proxy uses port 5000. Run `npm run server` to start only the API. To serve the production client through Express, run `npm run build --prefix client` and then `npm start`.

## Tests

```sh
npm run lint
npm test
npm test --prefix client -- --watchAll=false --runInBand
```

The backend tests use database doubles and local HTTP. The live MongoDB verification uses synthetic data in an isolated database.

See the [route plan](docs/plan.md) and the [MongoDB index report](docs/indexes.md).
