import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

export const generateInvitationCard = async (eventId, guest, qrDataUrl, link) => {
  const outputDir = path.resolve(`server/generated/${eventId}`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const safeName = guest.name.replace(/[^a-z0-9]/gi, "_"); // pour éviter les bugs dans le nom de fichier
  const filePath = path.join(outputDir, `invite_${safeName}.png`);

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; }
          .card {
            border: 2px solid #333;
            border-radius: 16px;
            padding: 20px;
            width: 400px;
            margin: auto;
          }
          h2 { margin: 0 0 10px; }
          img { margin-top: 20px; }
          .link { font-size: 12px; margin-top: 15px; color: #444; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Invitation - ${guest.name}</h2>
          <p>Événement : ${eventId}</p>
          <img src="${qrDataUrl}" width="200" />
          <p class="link">${link}</p>
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.screenshot({ path: filePath });
  await browser.close();

  return filePath;
};
