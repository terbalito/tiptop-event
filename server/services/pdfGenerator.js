// server/services/pdfGenerator.js
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour nettoyer le texte des caractères problématiques
const cleanText = (text) => {
  if (!text) return '';
  
  const replacements = {
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'à': 'a', 'â': 'a', 'ä': 'a',
    'î': 'i', 'ï': 'i',
    'ô': 'o', 'ö': 'o',
    'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'À': 'A', 'Â': 'A', 'Ä': 'A',
    'Î': 'I', 'Ï': 'I',
    'Ô': 'O', 'Ö': 'O',
    'Ù': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C'
  };
  
  return text.replace(/[éèêëàâäîïôöùûüçÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ]/g, char => replacements[char] || char);
};

export async function generateInvitationPdf(inviteData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Essayez de charger les polices Unicode, sinon utilisez Helvetica
      try {
        const notoSansRegular = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
        const notoSansBold = path.join(__dirname, '../fonts/NotoSans-Bold.ttf');
        
        doc.registerFont('NotoSans', notoSansRegular);
        doc.registerFont('NotoSans-Bold', notoSansBold);
        console.log('Polices Noto Sans chargees avec succes');
      } catch (fontError) {
        console.warn('Polices Noto Sans non disponibles, utilisation des polices par defaut');
        doc.registerFont('Helvetica', 'Helvetica');
        doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');
      }

      // Couleurs
      const colors = {
        primary: '#2c3e50',
        secondary: '#e74c3c', 
        accent: '#3498db',
        gold: '#f39c12',
        lightBg: '#f8f9fa',
        darkText: '#2c3e50',
        lightText: '#7f8c8d'
      };

      // Fond de page
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill(colors.lightBg);

      // Carte d'invitation
      const cardWidth = doc.page.width - 80;
      const cardHeight = doc.page.height - 120;
      const cardX = 40;
      const cardY = 40;

      // Fond de carte
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15)
         .fill('#ffffff')
         .stroke(colors.gold);

      let currentY = cardY + 40;

      // Titre
      doc.font('Helvetica-Bold').fontSize(28).fillColor(colors.primary)
         .text('INVITATION', cardX + 20, currentY, {
           width: cardWidth - 40,
           align: 'center'
         });
      currentY += 50;

      // Nom de l'evenement
      if (inviteData.event && inviteData.event.name) {
        doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.secondary)
           .text(cleanText(inviteData.event.name), cardX + 20, currentY, {
             width: cardWidth - 40,
             align: 'center'
           });
        currentY += 35;
      }

      // Date et lieu
      if (inviteData.event) {
        doc.font('Helvetica').fontSize(12).fillColor(colors.darkText);
        
        const eventDate = new Date(inviteData.event.date);
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Utiliser des symboles texte au lieu d'emojis
        doc.text(`Date: ${cleanText(formattedDate)}`, cardX + 20, currentY, {
          width: cardWidth - 40,
          align: 'center'
        });
        currentY += 22;

        if (inviteData.event.location) {
          doc.text(`Lieu: ${cleanText(inviteData.event.location)}`, cardX + 20, currentY, {
            width: cardWidth - 40,
            align: 'center'
          });
          currentY += 40;
        }
      }

      // Separateur
      doc.strokeColor('#e0e0e0')
         .moveTo(cardX + 30, currentY)
         .lineTo(cardX + cardWidth - 30, currentY)
         .stroke();
      currentY += 30;

      // Nom de l'invite
      doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.primary)
         .text(cleanText(inviteData.name), cardX + 20, currentY, {
           width: cardWidth - 40,
           align: 'center'
         });
      currentY += 35;

      // Informations invite
      doc.font('Helvetica').fontSize(12).fillColor(colors.darkText);

      if (inviteData.email) {
        doc.text(`Email: ${cleanText(inviteData.email)}`, cardX + 20, currentY, {
          width: cardWidth - 40,
          align: 'center'
        });
        currentY += 20;
      }

      if (inviteData.tableNumber) {
        doc.text(`Table: ${inviteData.tableNumber}`, cardX + 20, currentY, {
          width: cardWidth - 40,
          align: 'center'
        });
        currentY += 40;
      }

      // QR Code
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(inviteData.link, { 
          width: 150,
          margin: 2,
          color: {
            dark: colors.primary,
            light: '#FFFFFF'
          }
        });
        
        const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        const qrSize = 120;
        const qrX = cardX + (cardWidth - qrSize) / 2;
        
        doc.image(qrCodeBuffer, qrX, currentY, { 
          width: qrSize, 
          height: qrSize 
        });
        currentY += qrSize + 25;

      } catch (qrError) {
        console.warn('Erreur generation QR code:', qrError);
        doc.text('QR Code non disponible', cardX + 20, currentY, {
          width: cardWidth - 40,
          align: 'center'
        });
        currentY += 30;
      }

      // Lien d'invitation
      doc.font('Helvetica').fontSize(10).fillColor(colors.accent)
         .text(inviteData.link, cardX + 20, currentY, {
           width: cardWidth - 40,
           align: 'center'
         });

      // Pied de page
      const footerY = cardY + cardHeight + 15;
      doc.font('Helvetica').fontSize(9).fillColor(colors.lightText)
         .text('Genere par TipTop Events', cardX + 20, footerY, {
           width: cardWidth - 40,
           align: 'center'
         });

      doc.end();
    } catch (error) {
      console.error('Erreur dans generateInvitationPdf:', error);
      reject(error);
    }
  });
}