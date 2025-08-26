import { parseExcel } from "../utils/excelParser.js";
import { db } from "../services/firebase.js";
import fs from "fs";

export const uploadInvites = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!req.file) return res.status(400).json({ error: "Aucun fichier fourni" });

    // parse Excel en JSON
    const guests = await parseExcel(req.file.path);

    // save dans Firebase
    const batch = db.batch();
    guests.forEach((guest) => {
      const docRef = db.collection("invites").doc();
      batch.set(docRef, {
        ...guest,
        eventId,
        scanned: false,
        createdAt: new Date(),
      });
    });
    await batch.commit();

    // cleanup du fichier local
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "Invités importés avec succès ✅",
      count: guests.length,
    });
  } catch (err) {
    console.error("Erreur uploadInvites:", err);
    res.status(500).json({ error: "Erreur serveur lors de l’upload" });
  }
};
