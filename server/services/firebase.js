import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('../config/serviceAccountKey.json'); // à générer via Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
