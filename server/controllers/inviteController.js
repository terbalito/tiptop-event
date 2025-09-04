// server/controllers/inviteController.js
import crypto from "crypto";
import { parseExcel } from "../utils/excelParser.js";
import admin from "../services/firebase.js";
import fs from "fs";
import { generateInvitationCard } from "../services/imageGenerator.js";
import { generateInviteQR } from "../services/qrCodeService.js";
import { generateInvitationPdf } from "../services/pdfGenerator.js";


const db = admin.firestore();

// Fonction pour générer un token admin
const generateAdminToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

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

      // 1) QR + lien unique
      const { qrDataUrl, tokenHash, link } = await generateInviteQR(eventId, guest.id);

      // 2) Générer un token admin
      const adminToken = generateAdminToken();
      const adminTokenHash = crypto.createHash("sha256").update(adminToken).digest("hex");

      // 3) Générer la carte PNG
      const cardUrl = await generateInvitationCard(eventId, guest, qrDataUrl, link);

      // 4) Sauvegarder en base avec les deux tokens
      await db
        .collection("events")
        .doc(eventId)
        .collection("invites")
        .doc(guest.id)
        .update({
          tokenHash,
          adminTokenHash, // Stocker le hash du token admin
          link,
          cardUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      results.push({
        id: guest.id,
        name: guest.name,
        link,
        cardUrl,
        adminToken, // Renvoyer le token en clair pour l'admin
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

export const getInviteById = async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;

    const doc = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .doc(inviteId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Invité introuvable" });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
      eventId,
    });
  } catch (error) {
    console.error("Erreur getInviteById:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Enregistrer un device pour un invité
export const registerDevice = async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;
    const { deviceId } = req.body;

    const inviteRef = db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .doc(inviteId);

    const doc = await inviteRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Invité introuvable" });
    }

    await inviteRef.update({
      registeredDevice: deviceId,
      registeredAt: new Date().toISOString(),
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
    
    // Vérifier soit le token normal soit le token admin
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const isValidToken = hash === invite.tokenHash || hash === invite.adminTokenHash;

    if (!isValidToken) {
      return res.status(401).json({ error: "Token invalide" });
    }

    // Récupérer les infos de l'événement
    const eventDoc = await db.collection("events").doc(eventId).get();
    const eventData = eventDoc.exists ? eventDoc.data() : {};

    // Préparer les données pour le PDF
    const pdfData = {
      name: invite.name,
      email: invite.email,
      tableNumber: invite.tableNumber,
      link: invite.link,
      event: {
        name: eventData.name,
        date: eventData.date,
        location: eventData.location
      }
    };

    const pdfBuffer = await generateInvitationPdf(pdfData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invitation_${inviteId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Erreur downloadInvitationPdf:", err);
    res.status(500).json({ error: "Erreur lors de la génération du PDF" });
  }
};
