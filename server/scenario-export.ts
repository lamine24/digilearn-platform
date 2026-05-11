import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
// @ts-ignore
import { convert } from 'html-to-text';

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
 * Export scenario to PDF format using html-pdf-node
 */
export async function exportScenarioPdf(data: ScenarioExportData): Promise<Buffer> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 20px;
          }
          h1 {
            color: #0066cc;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 10px;
          }
          h2 {
            color: #0066cc;
            margin-top: 20px;
          }
          h3 {
            color: #666;
            margin-top: 15px;
          }
          .metadata {
            background-color: #f5f5f5;
            padding: 10px;
            border-left: 4px solid #0066cc;
            margin: 15px 0;
            font-style: italic;
          }
          .content {
            margin-top: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          strong {
            font-weight: bold;
          }
          em {
            font-style: italic;
          }
          blockquote {
            border-left: 4px solid #ccc;
            margin-left: 0;
            padding-left: 15px;
            color: #666;
          }
          code {
            background-color: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
          pre {
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
          }
          pre code {
            background-color: transparent;
            padding: 0;
          }
          ul, ol {
            margin: 10px 0;
            padding-left: 30px;
          }
          li {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <h1>${data.projectTitle}</h1>
        <h2>${data.title}</h2>
        
        <div class="metadata">
          <p><strong>Modèle pédagogique:</strong> ${data.pedagogicalModel}</p>
          <p><strong>Durée estimée:</strong> ${data.estimatedDuration} minutes</p>
          <p><strong>Créé le:</strong> ${new Date(data.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
        
        <h3>Contenu du scénario</h3>
        <div class="content">
          ${data.description}
        </div>
      </body>
    </html>
  `;

  try {
    // Use html-pdf-node to convert HTML to PDF
    // @ts-ignore
    const htmlPdf = await import('html-pdf-node');
    
    const options = {
      format: 'A4',
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      printBackground: true,
    };
    
    const file = { content: html };
    // html-pdf-node exports generatePdf as default
    const buffer = await htmlPdf.default(file, options);
    return buffer;
  } catch (error) {
    console.error('PDF conversion error:', error);
    // Fallback: return HTML as buffer if PDF conversion fails
    return Buffer.from(html, 'utf-8');
  }
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
  const ext = format === 'pdf' ? 'pdf' : 'docx';

  return `scenario-${sanitized}-${timestamp}.${ext}`;
}
