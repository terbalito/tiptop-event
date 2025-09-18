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
    
    // ✅ NETTOYEZ la chaîne Base64 (enlève les espaces, retours à la ligne)
    const cleanBase64 = serviceAccountBase64.trim().replace(/\s+/g, '');
    
    const decoded = Buffer.from(cleanBase64, "base64").toString("utf-8");

    // Pour éviter d'afficher la clé complète, on ne montre que le début et la fin
    console.log("Clé décodée (début) :", decoded.slice(0, 50), "...");
    console.log("Clé décodée (fin) :", decoded.slice(-50));

    const serviceAccount = JSON.parse(decoded);

    console.log("JSON Firebase parsé avec succès ✅");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin initialisé ✅");
  } catch (err) {
    console.error("Erreur lors du décodage/parsing de FIREBASE_SERVICE_ACCOUNT :", err);
    console.error("Base64 reçu:", serviceAccountBase64?.slice(0, 100), "...");
    throw err;
  }
}

const db = admin.firestore();
console.log("Firestore prêt ✅");

export { db, admin };
export default admin;