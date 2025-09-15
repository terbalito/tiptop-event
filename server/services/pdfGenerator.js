export async function generateInvitationPdf(inviteData) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📄 Début génération PDF pour:', inviteData.name);
      
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Test simple pour vérifier que PDFDocument fonctionne
      doc.font('Helvetica').fontSize(20).text('Test PDF', 100, 100);
      doc.end();

      const chunks = [];
      doc.on('data', (chunk) => {
        console.log('📦 Chunk reçu:', chunk.length, 'bytes');
        chunks.push(chunk);
      });
      
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('✅ PDF généré avec succès - Taille:', buffer.length, 'bytes');
        
        // Test: sauvegarder temporairement pour inspection
        const testPath = path.join(__dirname, 'test_debug.pdf');
        fs.writeFileSync(testPath, buffer);
        console.log('🔍 PDF test sauvegardé:', testPath);
        
        resolve(buffer);
      });
      
      doc.on('error', (error) => {
        console.error('❌ Erreur génération PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Erreur dans generateInvitationPdf:', error);
      reject(error);
    }
  });
}