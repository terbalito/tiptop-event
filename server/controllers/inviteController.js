// server/controllers/inviteController.js
import crypto from "crypto";
import { parseExcel } from "../utils/excelParser.js";
import admin from "../services/firebase.js";
import fs from "fs";
import { generateInvitationCard } from "../services/imageGenerator.js";
import { generateInviteQR } from "../services/qrCodeService.js";
import { generateInvitationPdf } from "../services/pdfGenerator.js";

const db = admin.firestore();

// FRONTEND_URL utilisé pour construire les liens d'invitation (prod / dev)
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

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
        deviceId: null,
        devices: [],
        link: null,
        tokenHash: null,
        cardUrl: null,
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
      const { qrDataUrl, tokenHash, link: generatedLink } = await generateInviteQR(eventId, guest.id);

      // 2) Token admin
      const adminToken = generateAdminToken();
      const adminTokenHash = crypto.createHash("sha256").update(adminToken).digest("hex");

      // 3) Lien final
      let finalLink = generatedLink;
      // ... (votre code existant pour rebuild le lien)

      // 4) Générer la carte PNG
      const cardUrl = await generateInvitationCard(eventId, guest, qrDataUrl, finalLink);

      // 5) ✅ GÉNÉRER ET STOCKER LE PDF
      let pdfUrl = null;
      try {
        // Récupérer les infos de l'événement
        const eventDoc = await db.collection("events").doc(eventId).get();
        const event = eventDoc.exists ? eventDoc.data() : null;

        const pdfData = {
          name: guest.name,
          email: guest.email,
          tableNumber: guest.tableNumber,
          link: finalLink,
          event: event ? {
            name: event.name,
            date: event.date,
            location: event.location
          } : null
        };

        // Générer le PDF
        const pdfBuffer = await generateInvitationPdf(pdfData);
        
        // Stocker le PDF dans generated/
        const pdfDir = path.join(process.cwd(), "server", "generated", eventId);
        if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
        
        const pdfFilename = `invitation_${guest.name.replace(/\s+/g, '_')}_${guest.id}.pdf`;
        const pdfPath = path.join(pdfDir, pdfFilename);
        
        fs.writeFileSync(pdfPath, pdfBuffer);
        pdfUrl = `/generated/${eventId}/${pdfFilename}`;
        
        console.log('✅ PDF généré et stocké:', pdfUrl);

      } catch (pdfError) {
        console.error('❌ Erreur génération PDF:', pdfError);
        // Continuer même si le PDF échoue
      }

      // 6) Sauvegarder en base avec PDF
      await db
        .collection("events")
        .doc(eventId)
        .collection("invites")
        .doc(guest.id)
        .update({
          tokenHash,
          adminTokenHash,
          link: finalLink,
          cardUrl,
          pdfUrl, // ✅ Stocker l'URL du PDF
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      results.push({
        id: guest.id,
        name: guest.name,
        link: finalLink,
        cardUrl,
        pdfUrl, // ✅ Inclure dans la réponse
        adminToken,
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

// Nouveau contrôleur
export const downloadStoredPdf = async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;
    
    const doc = await db.collection("events").doc(eventId)
                      .collection("invites").doc(inviteId).get();
    
    if (!doc.exists || !doc.data().pdfUrl) {
      return res.status(404).json({ error: "PDF non trouvé" });
    }

    const pdfUrl = doc.data().pdfUrl;
    const filePath = path.join(process.cwd(), "server", pdfUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier PDF non trouvé" });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);

  } catch (error) {
    console.error('❌ Erreur downloadStoredPdf:', error);
    res.status(500).json({ error: error.message });
  }
};

/* ---------------------------
   ENDPOINTS PUBLICS
   --------------------------- */

export const getInviteById = async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;
    
    console.log('🔍 Recherche invitation:', { eventId, inviteId });
    
    const doc = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .doc(inviteId)
      .get();

    console.log('📄 Résultat Firebase:', { exists: doc.exists });
    
    if (!doc.exists) {
      return res.status(404).json({ message: "Invité introuvable" });
    }

    const data = doc.data();
    res.json({
      id: doc.id,
      name: data.name,
      email: data.email,
      tableNumber: data.tableNumber,
      scanned: data.scanned,
      cardUrl: data.cardUrl,
      link: data.link,
      eventId,
    });
  } catch (error) {
    console.error("❌ Erreur getInviteById:", error);
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

    // Mettre à jour ou ajouter le deviceId
    await inviteRef.update({
      registeredDevice: deviceId,
      registeredAt: new Date().toISOString(),
      devices: admin.firestore.FieldValue.arrayUnion({
        deviceId,
        registeredAt: new Date().toISOString(),
        userAgent: req.headers["user-agent"],
      }),
    });

    res.json({
      success: true,
      message: "Appareil enregistré avec succès",
    });
  } catch (error) {
    console.error("Erreur registerDevice:", error);
    res.status(500).json({ message: error.message });
  }
};

export const downloadInvitationPdf = async (req, res, next) => {
  try {
    console.log('📄 PDF Request:', {
      eventId: req.params.eventId,
      inviteId: req.params.inviteId,
      token: req.query.t,
      timestamp: new Date().toISOString()
    });

    const { eventId, inviteId } = req.params;
    const token = req.query.t;

    const doc = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .doc(inviteId)
      .get();

    if (!doc.exists) {
      console.error('❌ Invité non trouvé:', { eventId, inviteId });
      return res.status(404).json({ error: "Invité non trouvé" });
    }

    const invite = doc.data();
    console.log('📋 Données invité:', { name: invite.name, email: invite.email });

    // Récupérer les infos de l'événement
    const eventDoc = await db.collection("events").doc(eventId).get();
    const event = eventDoc.exists ? eventDoc.data() : null;

    // Préparer les données pour le PDF
    const pdfData = {
      name: invite.name,
      email: invite.email,
      tableNumber: invite.tableNumber,
      link: invite.link,
      event: event ? {
        name: event.name,
        date: event.date,
        location: event.location
      } : null
    };

    console.log('🔄 Génération PDF...');
    const pdfBuffer = await generateInvitationPdf(pdfData);
    console.log('✅ PDF généré avec succès:', { size: pdfBuffer.length });

    // Forcer le téléchargement
    const filename = `invitation_${invite.name.replace(/\s+/g, '_')}.pdf`;
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('❌ Erreur downloadInvitationPdf:', {
      message: err.message,
      stack: err.stack,
      eventId: req.params.eventId,
      inviteId: req.params.inviteId
    });
    next(err);
  }
};
