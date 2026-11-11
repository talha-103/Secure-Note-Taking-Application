import { connectDb, disconnectDb } from '../src/config/db.js';
import { ensureInitialAdmin } from '../src/modules/users/bootstrap-admin.js';

try {
  await connectDb(
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_notes',
  );
  const created = await ensureInitialAdmin();
  console.log(
    created
      ? 'Initial admin created. Password change required on sign-in.'
      : 'An admin already exists or the common configuration has no admin credentials.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
