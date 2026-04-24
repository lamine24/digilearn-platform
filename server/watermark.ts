import { PDFDocument, rgb } from "pdf-lib";
import fetch from "node-fetch";

export async function addWatermarkToPDF(pdfUrl: string, userName: string): Promise<Buffer> {
  try {
    // Récupérer le PDF depuis l'URL
    const response = await fetch(pdfUrl);
    const pdfBytes = await response.arrayBuffer();

    // Charger le PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Ajouter un filigrane à chaque page
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();

      // Ajouter le texte filigrane (simple, sans rotation)
      page.drawText(`${userName}`, {
        x: width / 2 - 100,
        y: height / 2,
        size: 50,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.2,
      });

      // Ajouter la date
      page.drawText(`${new Date().toLocaleDateString("fr-FR")}`, {
        x: width / 2 - 80,
        y: height / 2 - 50,
        size: 30,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.2,
      });
    }

    // Retourner le PDF modifié
    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error("Erreur lors de l'ajout du filigrane:", error);
    throw error;
  }
}
