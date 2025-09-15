// test-pdf.js
import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test-simple.pdf'));
doc.font('Helvetica').fontSize(20).text('Hello PDF!', 100, 100);
doc.end();

console.log('✅ PDF test créé: test-simple.pdf');