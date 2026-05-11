import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
// @ts-ignore
import { convert } from 'html-to-text';
import PDFDocument from 'pdfkit';

interface ScenarioExportData {
  title: string;
  description: string;
  pedagogicalModel: string;
  estimatedDuration: number;
  createdAt: Date;
  projectTitle: string;
}

/**
 * Convert HTML to plain text for Word export
 */
function htmlToPlainText(html: string): string {
  return convert(html, {
    wordwrap: 80,
    preserveNewlines: true,
  });
}

/**
 * Parse HTML and convert to Word paragraphs
 */
function htmlToWordParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Simple HTML parser - convert to plain text for now
  const plainText = htmlToPlainText(html);
  const lines = plainText.split('\n');

  for (const line of lines) {
    if (line.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
            }),
          ],
        })
      );
    } else {
      paragraphs.push(new Paragraph(''));
    }
  }

  return paragraphs;
}

/**
 * Export scenario to Word format
 */
export async function exportScenarioToWord(data: ScenarioExportData): Promise<Buffer> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: data.projectTitle,
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph(''),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph(''),
    new Paragraph({
      children: [
        new TextRun({
          text: `Modèle pédagogique: ${data.pedagogicalModel}`,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Durée estimée: ${data.estimatedDuration} minutes`,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Créé le: ${new Date(data.createdAt).toLocaleDateString('fr-FR')}`,
          italics: true,
        }),
      ],
    }),
    new Paragraph(''),
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [
        new TextRun({
          text: 'Contenu du scénario',
          bold: true,
        }),
      ],
    }),
    new Paragraph(''),
    ...htmlToWordParagraphs(data.description),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Export scenario to PDF format using pdfkit
 */
export async function exportScenarioPdf(data: ScenarioExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (err: Error) => {
        reject(err);
      });

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text(data.projectTitle, {
        align: 'center',
        underline: true,
      });

      doc.moveDown(0.5);

      // Subtitle
      doc.fontSize(16).font('Helvetica-Bold').text(data.title, {
        align: 'center',
      });

      doc.moveDown(1);

      // Metadata box
      doc.fontSize(10).font('Helvetica');
      doc.rect(50, doc.y, 495, 80).stroke();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

      doc.text(`Modèle pédagogique: ${data.pedagogicalModel}`, 60, doc.y + 5);
      doc.text(`Durée estimée: ${data.estimatedDuration} minutes`);
      doc.text(
        `Créé le: ${new Date(data.createdAt).toLocaleDateString('fr-FR')}`
      );

      doc.moveDown(1);

      // Content heading
      doc.fontSize(12).font('Helvetica-Bold').text('Contenu du scénario');
      doc.moveDown(0.5);

      // Content
      doc.fontSize(10).font('Helvetica');
      
      // Convert HTML to plain text and wrap it
      const plainText = htmlToPlainText(data.description);
      doc.text(plainText, {
        align: 'left',
        width: 495,
      });

      // Add footer with page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 1; i <= pageCount; i++) {
        doc.switchToPage(i - 1);
        doc.fontSize(8).text(
          `Page ${i} / ${pageCount}`,
          50,
          doc.page.height - 30,
          { align: 'center' }
        );
      }

      // End the document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  title: string,
  format: 'pdf' | 'docx'
): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const timestamp = new Date().toISOString().split('T')[0];
  const extension = format === 'pdf' ? 'pdf' : 'docx';

  return `scenario-${sanitized}-${timestamp}.${extension}`;
}
