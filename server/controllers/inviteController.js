// server/controllers/inviteController.js
import { parseExcel } from "../utils/excelParser.js";
import admin from "../services/firebase.js";
import fs from "fs";
import { generateInvitationCard } from "../services/imageGenerator.js";
import { generateInviteQR } from "../services/qrCodeService.js"; // 👈 NEW

const db = admin.firestore();

export const uploadInvites = async (req, res) => {
  try {
    const { eventId } = req.params;
    const filePath = req.file.path;
    const guests = await parseExcel(filePath);

    if (!guests || guests.length === 0) {
      return res.status(400).json({ message: "Aucun invité trouvé dans le fichier" });
    }

    const batch = db.batch();
    const invitesRef = db.collection("events").doc(eventId).collection("invites");

    guests.forEach((guest) => {
      const newInviteRef = invitesRef.doc();
      batch.set(newInviteRef, {
        name: guest.name,
        email: guest.email || "",
        phone: guest.phone || "",
        tableNumber: guest.tableNumber || null,
        code:
          guest.code ||
          Math.random().toString(36).substring(2, 8).toUpperCase(),
        scanned: false,
        deviceId: null,        // pour l’anti-fraude plus tard
        link: null,            // rempli à la génération
        tokenHash: null,       // rempli à la génération (jamais le token en clair)
        cardUrl: null,         // URL publique de la carte PNG
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    fs.unlinkSync(filePath);

    res.json({ message: "Invités ajoutés avec succès", count: guests.length });
  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getInvitesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const snapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .orderBy("createdAt", "asc")
      .get();

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

export const getInvitesCount = async (req, res) => {
  try {
    const { eventId } = req.params;
    const snapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .get();

    res.json({ count: snapshot.size });
  } catch (error) {
    console.error("Erreur getInvitesCount:", error);
    res.status(500).json({ message: error.message });
  }
};

// 👇 Génère lien + QR + carte pour TOUT l’event
export const generateInvitations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const snapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "Aucun invité trouvé" });
    }

    const results = [];

    for (const d of snapshot.docs) {
      const guest = { id: d.id, ...d.data() };

      // Skip si déjà généré (optionnel)
      // if (guest.link && guest.cardUrl && guest.tokenHash) { ... }

      // 1) QR + lien unique
      const { qrDataUrl, tokenHash, link } = await generateInviteQR(eventId, guest.id);

      // 2) Générer la carte PNG
      const cardUrl = await generateInvitationCard(eventId, guest, qrDataUrl, link);

      // 3) Sauvegarder en base (ne stocke que le hash du token)
      await db
        .collection("events")
        .doc(eventId)
        .collection("invites")
        .doc(guest.id)
        .update({
          tokenHash,
          link,
          cardUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      results.push({
        id: guest.id,
        name: guest.name,
        link,
        cardUrl,
      });
    }

    res.json({
      message: "Invitations générées ✅",
      invites: results,
    });
  } catch (err) {
    console.error("Erreur generateInvitations:", err);
    res.status(500).json({ message: err.message });
  }
};
