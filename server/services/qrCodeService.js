// server/services/qrCodeService.js
import QRCode from "qrcode";
import crypto from "crypto";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

export const generateInviteQR = async (eventId, inviteId) => {
  // 1) Génère un token aléatoire, puis son hash (on stocke QUE le hash)
  const token = crypto.randomBytes(16).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // 2) Lien unique vers la page publique d’invitation
  const link = `${CLIENT_URL}/invite/${eventId}/${inviteId}?t=${token}`;

  // 3) QRCode en DataURL (PNG)
  const qrDataUrl = await QRCode.toDataURL(link, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
  });

  return { qrDataUrl, tokenHash, link };
};
