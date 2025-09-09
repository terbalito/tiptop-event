import admin from "firebase-admin";

console.log("=== Initialisation Firebase ===");
console.log("ENV FIREBASE_SERVICE_ACCOUNT présent :", !!process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountBase64) {
    throw new Error("La variable FIREBASE_SERVICE_ACCOUNT n'est pas définie !");
  }

  try {
    console.log("Décodage de la clé Firebase...");
    const decoded = Buffer.from(serviceAccountBase64, "base64").toString("utf-8");

    // Pour éviter d'afficher la clé complète, on ne montre que le début et la fin
    console.log("Clé décodée (début) :", decoded.slice(0, 100), "...");
    console.log("Clé décodée (fin) :", decoded.slice(-100));

    const serviceAccount = JSON.parse(decoded);

    console.log("JSON Firebase parsé avec succès ✅");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin initialisé ✅");
  } catch (err) {
    console.error("Erreur lors du décodage/parsing de FIREBASE_SERVICE_ACCOUNT :", err);
    throw err;
  }
}

const db = admin.firestore();
console.log("Firestore prêt ✅");

export { db, admin };
export default admin;
