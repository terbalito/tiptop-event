import Invite from "../models/inviteModel.js";

export const scanInvite = async (req, res) => {
  const { eventId, inviteId } = req.params;

  try {
    const invite = await Invite.findOne({ eventId, id: inviteId });
    if (!invite) {
      req.io.emit("invalidCode", { eventId, inviteId });
      return res.status(404).json({ error: "Invitation introuvable" });
    }

    if (invite.scanned) {
      req.io.emit("alreadyScanned", { eventId, inviteId, invite });
      return res.status(200).json({ message: "Déjà scanné", invite });
    }

    invite.scanned = true;
    invite.scannedAt = new Date();
    await invite.save();

    // notifier tous les clients connectés
    req.io.emit("scanSuccess", { eventId, inviteId, invite });

    res.status(200).json({ message: "Scan réussi", invite });
  } catch (err) {
    console.error("Erreur scan:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
