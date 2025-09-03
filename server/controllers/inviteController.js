// server/controllers/inviteController.js
import { parseExcel } from "../utils/excelParser.js";
import admin from "../services/firebase.js";
import fs from "fs";
import { generateInvitationCard } from "../services/imageGenerator.js";
import { generateInviteQR } from "../services/qrCodeService.js"; 

import { generateInvitationPdf } from "../services/pdfGenerator.js";


const db = admin.firestore();

/** Upload Excel -> écrit les invités (inchangé sauf commentaires) */
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
        devices: [],           // tableau d'appareils (multi)
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

/** Retourne tous les invites pour un event */
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

/** Retourne le compte d'invités pour un event */
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

/** Génère lien + QR + carte PNG pour tous les invités d'un event */
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

      // 1) QR + lien unique (service doit renvoyer qrDataUrl (dataURL), tokenHash, link)
      const { qrDataUrl, tokenHash, link } = await generateInviteQR(eventId, guest.id);

      // 2) Générer la carte PNG (imageGenerator renvoie un chemin relatif public)
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

/* ---------------------------
   NOUVEAUX ENDPOINTS PUBLICS
   --------------------------- */

/**
 * Retourne un invité à partir de son inviteId (cherche dans collectionGroup 'invites').
 * Renvoie aussi l'eventId parent pour affichage.
 */
export const getInviteById = async (req, res) => {
  try {
    const { inviteId } = req.params;

    // CollectionGroup "invites"
    const q = await db.collectionGroup("invites").get();

    // Filtrer manuellement sur doc.id
    const doc = q.docs.find(d => d.id === inviteId);

    if (!doc) return res.status(404).json({ message: "Invité introuvable" });

    const data = doc.data();
    const eventDocRef = doc.ref.parent.parent;
    const eventId = eventDocRef ? eventDocRef.id : null;

    let eventData = null;
    if (eventId) {
      const ev = await db.collection("events").doc(eventId).get();
      if (ev.exists) eventData = { id: ev.id, ...ev.data() };
    }

    res.json({
      id: doc.id,
      ...data,
      event: eventData,
      eventId,
    });
  } catch (error) {
    console.error("Erreur getInviteById:", error);
    res.status(500).json({ message: error.message });
  }
};


/**
 * Enregistre un deviceId pour un invité (anti-fraude).
 * Expose : POST /api/invites/invite/:inviteId/register-device  { deviceId }
 *
 * On stocke en array 'devices' (arrayUnion) et on met aussi deviceId (dernier)
 */
export const registerDevice = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { deviceId } = req.body;

    if (!deviceId) return res.status(400).json({ message: "deviceId manquant" });

    // Cherche doc invite via collectionGroup
    const q = await db.collectionGroup("invites").where("__name__", "==", inviteId).get();
    if (q.empty) return res.status(404).json({ message: "Invité introuvable" });

    const docRef = q.docs[0].ref;

    // Ajoute deviceId à la liste (évite doublons) et met deviceId (dernier) — admin.firestore.FieldValue.arrayUnion
    await docRef.update({
      devices: admin.firestore.FieldValue.arrayUnion(deviceId),
      deviceId, // garde aussi un champ deviceId (optionnel)
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur registerDevice:", error);
    res.status(500).json({ message: error.message });
  }
};




export const downloadInvitationPdf = async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;
    const token = req.query.t;

    // Vérif du hash en DB
    const doc = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .doc(inviteId)
      .get();

    if (!doc.exists) return res.status(404).json({ error: "Invite not found" });

    const invite = doc.data();
    const hash = require("crypto").createHash("sha256").update(token).digest("hex");

    if (hash !== invite.tokenHash) {
      return res.status(401).json({ error: "Token invalide" });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const invitationUrl = `${clientUrl}/invite/${eventId}/${inviteId}?t=${token}&admin=true`;

    const pdfBuffer = await generateInvitationPdf(invitationUrl);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invitation_${inviteId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Erreur downloadInvitationPdf:", err);
    res.status(500).json({ error: "Erreur lors de la génération du PDF" });
  }
};
