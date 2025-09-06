// server/controllers/scanController.js
import Invite from "../models/inviteModel.js";

/**
 * Scan d'une invitation par QR code
 * @route POST /api/scan/:eventId/:inviteId
 */
export const scanInvite = async (req, res) => {
  try {
    const { eventId, inviteId } = req.params;

    // 🔎 Vérifie si l'invité existe
    const invite = await Invite.findOne({ eventId, _id: inviteId });
    if (!invite) {
      // socket emit "invalidCode"
      req.io.emit("invalidCode", { eventId, inviteId });
      return res.status(404).json({ error: "Invitation introuvable" });
    }

    // ⚠️ Déjà scanné ?
    if (invite.scanned) {
      req.io.emit("alreadyScanned", {
        eventId,
        inviteId,
        guest: invite.guestName,
        scannedAt: invite.scannedAt
      });
      return res.status(400).json({ error: "Déjà scannée" });
    }

    // ✅ Marquer comme scannée
    invite.scanned = true;
    invite.scannedAt = new Date();
    await invite.save();

    // socket emit "scanSuccess"
    req.io.emit("scanSuccess", {
      eventId,
      inviteId,
      guest: invite.guestName,
      scannedAt: invite.scannedAt
    });

    res.json({
      message: "Scan réussi",
      guest: invite.guestName,
      scannedAt: invite.scannedAt
    });
  } catch (err) {
    console.error("Erreur scanInvite:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
};
