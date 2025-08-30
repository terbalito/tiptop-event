// utils/qrGenerator.js
const QRCode = require("qrcode");
const crypto = require("crypto");

// Génère un token hashé unique
function generateToken(inviteId, eventId) {
  return crypto
    .createHash("sha256")
    .update(inviteId + eventId + Date.now().toString())
    .digest("hex");
}

async function generateQr(inviteId, eventId) {
  const token = generateToken(inviteId, eventId);

  const payload = JSON.stringify({
    inviteId,
    eventId,
    token
  });

  // Génération du QR code sous forme d'image base64
  const qrDataUrl = await QRCode.toDataURL(payload);

  return { qrDataUrl, token };
}

module.exports = { generateQr };
