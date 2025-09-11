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

      // 1) QR + lien unique (generateInviteQR doit renvoyer tokenHash et un link
      //    qui contient le token en clair en query param, ex ?t=xxxxx)
      const { qrDataUrl, tokenHash, link: generatedLink } = await generateInviteQR(eventId, guest.id);

      // 2) Générer un token admin (en clair pour l'admin), stocker son hash
      const adminToken = generateAdminToken();
      const adminTokenHash = crypto.createHash("sha256").update(adminToken).digest("hex");

      // 3) Calculer le lien final en forçant l'origin FRONTEND_URL
      //    - si generateInviteQR a renvoyé un link contenant ?t=..., on récupère t et on rebuild le link
      let finalLink = generatedLink;
      try {
        if (generatedLink && typeof generatedLink === "string") {
          // essayer d'extraire le token query param 't' si présent
          let tokenParam = null;
          try {
            // use URL with base to handle relative urls
            const tmp = new URL(generatedLink, "http://localhost");
            tokenParam = tmp.searchParams.get("t");
          } catch (err) {
            // nothing
            tokenParam = null;
          }

          if (tokenParam) {
            finalLink = `${FRONTEND_URL}/invite/${eventId}/${guest.id}?t=${encodeURIComponent(tokenParam)}`;
          } else {
            // si pas de token dans generatedLink, on remplace simplement l'origin si possible
            // si generatedLink est relatif, on construit l'URL complète
            if (generatedLink.startsWith("/")) {
              finalLink = `${FRONTEND_URL}${generatedLink}`;
            } else if (generatedLink.startsWith("http")) {
              try {
                const tmp2 = new URL(generatedLink);
                finalLink = `${FRONTEND_URL}${tmp2.pathname}${tmp2.search}${tmp2.hash}`;
              } catch (e) {
                // fallback keep generatedLink
              }
            } else {
              // fallback
              finalLink = `${FRONTEND_URL}/invite/${eventId}/${guest.id}`;
            }
          }
        } else {
          finalLink = `${FRONTEND_URL}/invite/${eventId}/${guest.id}`;
        }
      } catch (err) {
        console.warn("Erreur rebuilding link, on garde generatedLink:", err);
        finalLink = generatedLink || `${FRONTEND_URL}/invite/${eventId}/${guest.id}`;
      }

      // 4) Générer la carte PNG
      const cardUrl = await generateInvitationCard(eventId, guest, qrDataUrl, finalLink);

      // 5) Sauvegarder en base avec les deux hashes et le link final
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
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // 6) Renvoyer un objet utile (ne PAS exposer les hashes !)
      results.push({
        id: guest.id,
        name: guest.name,
        link: finalLink,
        cardUrl,
        adminToken, // token en clair pour l'admin (utile immédiatement après la génération)
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
   ENDPOINTS PUBLICS
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

    const data = doc.data();

    // Ne jamais renvoyer les hashes ou champs sensibles au client public
    const publicData = {
      id: doc.id,
      name: data.name,
      email: data.email,
      tableNumber: data.tableNumber,
      scanned: data.scanned,
      cardUrl: data.cardUrl,
      link: data.link,
      eventId,
      // si tu veux renvoyer certaines infos d'événement, récupère-les ici
    };

    res.json(publicData);
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

export const downloadInvitationPdf = async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;
    const token = req.query.t;

    const doc = await db
      .collection("events")
      .doc(eventId)
      .collection("invites")
      .doc(inviteId)
      .get();

    if (!doc.exists) return res.status(404).json({ error: "Invite not found" });

    const invite = doc.data();

    // Récupérer infos événement
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const eventData = eventDoc.data();
    const eventDate = new Date(eventData.date);
    const isEventPassed = Date.now() > eventDate.getTime();

    // Vérifier tokens
    let isAdminToken = false;
    let isClientToken = false;
    let isNormalToken = false;

    if (token) {
      const hash = crypto.createHash("sha256").update(token).digest("hex");
      isAdminToken = hash === invite.adminTokenHash;
      isNormalToken = hash === invite.tokenHash;

      if (!isEventPassed) {
        try {
          const decoded = Buffer.from(token, "base64").toString("utf8");
          const [deviceId] = decoded.split(":");
          if (invite.registeredDevice === deviceId) {
            isClientToken = true;
          }
        } catch (e) {
          // ignore decode errors
        }
      }
    }

    if (!isAdminToken && !isClientToken && !isNormalToken) {
      if (isEventPassed) {
        return res.status(410).json({ error: "L'événement est terminé, le téléchargement n'est plus disponible" });
      }
      return res.status(401).json({ error: "Token invalide" });
    }

    // Préparer les données pour le PDF
    const pdfData = {
      name: invite.name,
      email: invite.email,
      tableNumber: invite.tableNumber,
      link: invite.link,
      event: {
        name: eventData.name,
        date: eventData.date,
        location: eventData.location,
      },
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
