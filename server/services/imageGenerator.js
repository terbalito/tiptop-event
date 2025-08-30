// server/services/imageGenerator.js
import fs from "fs";
import path from "path";
import PImage from "pureimage";
import { Buffer } from "buffer";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const sanitize = (str) =>
  String(str || "invite")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .substring(0, 40);

export const generateInvitationCard = async (eventId, guest, qrDataUrl, link) => {
  const outDir = path.join(process.cwd(), "server", "generated", eventId);
  ensureDir(outDir);

  try {
    const width = 800;
    const height = 1200;
    
    // Créer une nouvelle image
    const image = PImage.make(width, height);
    const ctx = image.getContext("2d");

    // Fond blanc
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // Texte du nom
    ctx.fillStyle = "#000000";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(guest.name || "Invité", width / 2, 100);

    // Charger l'image QR depuis dataURL
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
    
    // Pour PureImage, nous devons créer une image à partir du buffer
    // Cette partie est un peu plus complexe, donc utilisons une approche différente
    // Enregistrons d'abord le QR dans un fichier temporaire

    const tempQrPath = path.join(outDir, `temp_qr_${guest.id}.png`);
    fs.writeFileSync(tempQrPath, qrBuffer);
    
    // Charger l'image QR
    const qrImage = await PImage.decodePNGFromStream(fs.createReadStream(tempQrPath));
    
    // Dessiner le QR code
    const qrSize = 450;
    const qrX = (width - qrSize) / 2;
    const qrY = 200;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Lien en bas
    ctx.font = "16px Arial";
    ctx.fillText(link, width / 2, height - 50);

    const filename = `invite_${sanitize(guest.name)}_${guest.id}.png`;
    const outPath = path.join(outDir, filename);
    
    // Sauvegarder l'image
    await PImage.encodePNGToStream(image, fs.createWriteStream(outPath));
    
    // Nettoyer le fichier temporaire
    fs.unlinkSync(tempQrPath);

    return `/generated/${eventId}/${filename}`;

  } catch (error) {
    console.error("Erreur dans generateInvitationCard:", error);
    throw error;
  }
};