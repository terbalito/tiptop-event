import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../config/serviceAccountKey.json");

// Initialiser Firebase Admin une seule fois
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Firestore
const db = admin.firestore();

export { db, admin };
export default admin;
