// server/services/htmlPdfGenerator.js
import pdf from 'html-pdf';
import fs from 'fs';

export async function generateHtmlPdf(inviteData) {
  return new Promise((resolve, reject) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2c3e50; }
          .invite { border: 2px solid #3498db; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="invite">
          <h1>INVITATION</h1>
          <h2>${inviteData.event?.name || 'Événement'}</h2>
          <p><strong>Nom:</strong> ${inviteData.name}</p>
          <p><strong>Email:</strong> ${inviteData.email}</p>
          <p><strong>Table:</strong> ${inviteData.tableNumber || 'N/A'}</p>
          <p><strong>Lien:</strong> ${inviteData.link}</p>
        </div>
      </body>
      </html>
    `;

    pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) {
        console.error('❌ Erreur html-pdf:', err);
        reject(err);
      } else {
        console.log('✅ HTML-PDF généré - Taille:', buffer.length, 'bytes');
        resolve(buffer);
      }
    });
  });
}