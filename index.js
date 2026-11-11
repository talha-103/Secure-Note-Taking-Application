import { createApp } from './src/app.js';
import { ensureInitialAdmin } from './src/modules/users/bootstrap-admin.js';
import { readEnv } from './src/config/env.js';
import { connectDb, disconnectDb } from './src/config/db.js';

try {
  const env = readEnv();
  await connectDb(env.MONGODB_URI);
  if (await ensureInitialAdmin())
    console.log('Initial admin created. Password change required on sign-in.');
  createApp({ env }).listen(env.PORT, () =>
    console.log('Secure Notes API listening'),
  );
} catch (error) {
  console.error(error.message);
  await disconnectDb();
  process.exitCode = 1;
}
