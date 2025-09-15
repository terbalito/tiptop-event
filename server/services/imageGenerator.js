// server/services/imageGenerator.js
import fs from "fs";
import path from "path";
import PImage from "pureimage";
import { Buffer } from "buffer";
import { registerFont } from 'canvas';

// Enregistrement des polices
const fontsDir = path.join(process.cwd(), 'server', 'fonts');
try {
  registerFont(path.join(fontsDir, 'NotoSans-Bold.ttf'), { 
    family: 'Noto Sans', 
    weight: 'bold' 
  });
  
  registerFont(path.join(fontsDir, 'NotoSans-Regular.ttf'), { 
    family: 'Noto Sans', 
    weight: 'normal' 
  });
  console.log('✅ Polices Noto Sans chargées avec succès');
} catch (error) {
  console.warn('⚠️ Impossible de charger les polices Noto Sans:', error.message);
}

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

    // Texte du nom - Utiliser Noto Sans ou fallback
    ctx.fillStyle = "#000000";
    ctx.font = "48px 'Noto Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(guest.name || "Invité", width / 2, 100);

    // Charger l'image QR depuis dataURL
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
    
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
    ctx.font = "16px 'Noto Sans', Arial, sans-serif";
    ctx.fillText(link, width / 2, height - 50);

    const filename = `invite_${sanitize(guest.name)}_${guest.id}.png`;
    const outPath = path.join(outDir, filename);
    
    // Sauvegarder l'image
    await PImage.encodePNGToStream(image, fs.createWriteStream(outPath));
    
    // Nettoyer le fichier temporaire
    fs.unlinkSync(tempQrPath);

    console.log('✅ Carte PNG générée:', `/generated/${eventId}/${filename}`);
    return `/generated/${eventId}/${filename}`;

  } catch (error) {
    console.error("❌ Erreur dans generateInvitationCard:", error);
    throw error;
  }
};