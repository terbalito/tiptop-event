import { parseExcel } from "../utils/excelParser.js";
import admin from "../services/firebase.js"; // Import de l'admin SDK
import fs from "fs";

const db = admin.firestore();

export const uploadInvites = async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("Fichier reçu:", req.file);
    console.log("Event ID:", eventId);

    // 1. Parser le fichier Excel
    const filePath = req.file.path;
    const guests = await parseExcel(filePath);

    if (!guests || guests.length === 0) {
      return res.status(400).json({ message: "Aucun invité trouvé dans le fichier" });
    }

    // 2. Enregistrer dans Firebase avec Admin SDK
    const batch = db.batch();
    const invitesRef = db.collection('events').doc(eventId).collection('invites');

    guests.forEach((guest) => {
      const newInviteRef = invitesRef.doc(); // Crée un nouveau document avec ID auto-généré
      batch.set(newInviteRef, {
        name: guest.name,
        email: guest.email,
        phone: guest.phone || "",
        tableNumber: guest.tableNumber || null,
        code: guest.code || Math.random().toString(36).substring(2, 8).toUpperCase(),
        scanned: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Exécuter le batch
    await batch.commit();

    // Supprimer le fichier temporaire après usage
    fs.unlinkSync(filePath);

    res.json({ 
      message: "Invités ajoutés avec succès", 
      count: guests.length 
    });

  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getInvitesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("Fetching invites for event:", eventId);

    const snapshot = await db.collection('events').doc(eventId).collection('invites').get();
    const invites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(invites);
  } catch (error) {
    console.error("Erreur getInvitesByEvent:", error);
    res.status(500).json({ message: error.message });
  }
};