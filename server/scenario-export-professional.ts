/**
 * Professional Template Export Module
 * Exports scenarios following the professional template structure (Modele_Scenarise_.docx)
 * With proper Unicode support for French characters
 */

import PDFDocument from 'pdfkit';

interface ProfessionalScenarioData {
  // Module Identification
  author: string;
  institution: string;
  moduleTitle: string;
  teachingUnit?: string;
  level?: string;
  credits?: number;
  totalHours: number;
  prerequisites?: string;
  generalObjective: string;
  specificObjectives: string[];
  courseSummary: string;
  bibliography?: string[];

  // Course Scenarization
  sequences: Sequence[];
  finalEvaluation?: string;
  
  // Metadata
  createdAt: Date;
  pedagogicalModel: string;
}

interface Sequence {
  number: number;
  title: string;
  duration: {
    weeks: number;
    directContact: number; // hours
    personalWork: number; // hours
  };
  specificObjectives: ObjectiveItem[];
  digitalResources?: string;
  complementaryResources?: string;
  knowledgeTests?: string;
}

interface ObjectiveItem {
  roman: string; // I, II, III, etc.
  description: string;
}

/**
 * Sanitize text to handle Unicode characters properly
 * Replaces problematic characters with ASCII equivalents
 */
function sanitizeText(text: string | undefined): string {
  if (!text) return '';
  
  const replacements: { [key: string]: string } = {
    'é': 'e',
    'è': 'e',
    'ê': 'e',
    'ë': 'e',
    'à': 'a',
    'â': 'a',
    'ä': 'a',
    'ù': 'u',
    'û': 'u',
    'ü': 'u',
    'ô': 'o',
    'ö': 'o',
    'ç': 'c',
    'î': 'i',
    'ï': 'i',
    'É': 'E',
    'È': 'E',
    'Ê': 'E',
    'À': 'A',
    'Â': 'A',
    'Ù': 'U',
    'Û': 'U',
    'Ô': 'O',
    'Ç': 'C',
    'Î': 'I',
  };
  
  return text.replace(/[éèêëàâäùûüôöçîïÉÈÊÀÂÙÛÔÇÎ]/g, (char) => replacements[char] || char);
}

/**
 * Generate professional PDF export with proper formatting
 */
export async function exportProfessionalScenarioPdf(data: ProfessionalScenarioData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
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

      // ─── TITLE PAGE ───────────────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').text('SYLLABUS SCENARISE DE MODULE', {
        align: 'center',
        underline: true,
      });

      doc.moveDown(0.5);

      // Module title in blue box
      doc.rect(50, doc.y, 495, 30).fillAndStroke('#003366', '#003366');
      doc.fontSize(14).font('Helvetica-Bold').fillColor('white').text(sanitizeText(data.moduleTitle), 60, doc.y + 8, {
        width: 475,
      });
      doc.fillColor('black');
      doc.moveDown(1.5);

      // ─── SECTION 1: MODULE IDENTIFICATION ──────────────────────────
      doc.fontSize(12).font('Helvetica-Bold').text('1. IDENTIFICATION DU MODULE', {
        underline: true,
      });
      doc.moveDown(0.5);

      // Identification table
      const tableData = [
        ['Auteur', sanitizeText(data.author)],
        ['Institution', sanitizeText(data.institution)],
        ['Titre du module', sanitizeText(data.moduleTitle)],
        ['Niveau', sanitizeText(data.level || 'N/A')],
        ['Heures totales', data.totalHours.toString()],
        ['Credits', (data.credits || 0).toString()],
      ];

      tableData.forEach((row) => {
        drawTableRow(doc, row);
      });

      doc.moveDown(1);

      // General objectives
      doc.fontSize(11).font('Helvetica-Bold').text('Objectif general :');
      doc.fontSize(10).font('Helvetica').text(sanitizeText(data.generalObjective), {
        width: 495,
      });

      doc.moveDown(0.5);

      // Specific objectives
      doc.fontSize(11).font('Helvetica-Bold').text('Objectifs specifiques :');
      data.specificObjectives.forEach((obj, idx) => {
        doc.fontSize(10).font('Helvetica').text(`${idx + 1}. ${sanitizeText(obj)}`, {
          width: 495,
        });
      });

      doc.moveDown(1);

      // ─── SECTION 2: COURSE SCENARIZATION ───────────────────────────
      doc.fontSize(12).font('Helvetica-Bold').text('2. SCENARISTION DU COURS', {
        underline: true,
      });
      doc.moveDown(0.5);

      // Sequences
      data.sequences.forEach((sequence) => {
        drawSequence(doc, sequence);
      });

      // Final evaluation
      if (data.finalEvaluation) {
        doc.fontSize(10).font('Helvetica-Bold').text('Evaluation finale :');
        doc.fontSize(9).font('Helvetica').text(sanitizeText(data.finalEvaluation), {
          width: 495,
        });
      }

      doc.moveDown(1);

      // ─── FOOTER ────────────────────────────────────────────────────
      doc.fontSize(8).font('Helvetica').fillColor('gray').text(
        `Generated on ${new Date().toLocaleDateString('fr-FR')} | Pedagogical Model: ${sanitizeText(data.pedagogicalModel)}`,
        {
          align: 'center',
        }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw a table row with label and value
 */
function drawTableRow(doc: any, row: string[]): void {
  const x = 50;
  const labelWidth = 150;
  const currentY = doc.y;

  // Background color for alternating rows
  const bgColor = Math.random() > 0.5 ? '#f5f5f5' : '#ffffff';
  doc.rect(x, currentY, 495, 25).fill(bgColor);

  // Label
  doc.fontSize(9).font('Helvetica-Bold').fillColor('black').text(sanitizeText(row[0]), x + 5, currentY + 5, {
    width: labelWidth - 10,
  });

  // Value
  doc.fontSize(9).font('Helvetica').fillColor('black').text(sanitizeText(row[1]), x + labelWidth + 5, currentY + 5, {
    width: 495 - labelWidth - 10,
  });

  doc.moveDown(1.5);
}

/**
 * Draw a sequence section
 */
function drawSequence(doc: any, sequence: Sequence): void {
  doc.fontSize(11).font('Helvetica-Bold').fillColor('white').rect(50, doc.y, 495, 25).fill('#003366');
  doc.fontSize(11).font('Helvetica-Bold').fillColor('white').text(
    `Sequence ${sequence.number}: ${sanitizeText(sequence.title)}`,
    55,
    doc.y - 20
  );

  doc.fillColor('black');
  doc.moveDown(1.5);

  // Duration info
  doc.fontSize(9).font('Helvetica-Oblique').text(
    `Duration: ${sequence.duration.weeks} weeks | Direct Contact: ${sequence.duration.directContact}h | Personal Work: ${sequence.duration.personalWork}h`,
    {
      width: 495,
    }
  );

  doc.moveDown(0.5);

  // Specific objectives
  doc.fontSize(10).font('Helvetica-Bold').text('Specific Objectives:');
  sequence.specificObjectives.forEach((obj) => {
    doc.fontSize(9).font('Helvetica').text(`${obj.roman}. ${sanitizeText(obj.description)}`, {
      width: 495,
    });
  });

  // Digital resources
  if (sequence.digitalResources) {
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Digital Resources:');
    doc.fontSize(9).font('Helvetica').text(sanitizeText(sequence.digitalResources), { width: 495 });
  }

  // Complementary resources
  if (sequence.complementaryResources) {
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Complementary Resources:');
    doc.fontSize(9).font('Helvetica-Oblique').text(
      sanitizeText(sequence.complementaryResources),
      { width: 495 }
    );
  }

  // Knowledge tests
  if (sequence.knowledgeTests) {
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text(`Knowledge Tests - Chapter ${sequence.number}:`);
    doc.fontSize(9).font('Helvetica').text(sanitizeText(sequence.knowledgeTests), { width: 495 });
  }

  doc.moveDown(1);
}

/**
 * Export scenario to DOCX format (using simple text-based approach)
 * Note: For true DOCX support, consider using docx library
 */
export async function exportProfessionalScenarioDocx(data: ProfessionalScenarioData): Promise<Buffer> {
  // For now, return a text-based representation
  // In production, use the 'docx' npm package for proper DOCX generation
  const content = `
SYLLABUS SCENARISE DE MODULE

${sanitizeText(data.moduleTitle)}

1. IDENTIFICATION DU MODULE

Auteur: ${sanitizeText(data.author)}
Institution: ${sanitizeText(data.institution)}
Niveau: ${sanitizeText(data.level || 'N/A')}
Heures totales: ${data.totalHours}
Credits: ${data.credits || 0}

Objectif general:
${sanitizeText(data.generalObjective)}

Objectifs specifiques:
${data.specificObjectives.map((obj, idx) => `${idx + 1}. ${sanitizeText(obj)}`).join('\n')}

2. SCENARISTION DU COURS

${data.sequences
  .map(
    (seq) => `
Sequence ${seq.number}: ${sanitizeText(seq.title)}
Duration: ${seq.duration.weeks} weeks | Direct Contact: ${seq.duration.directContact}h | Personal Work: ${seq.duration.personalWork}h

Specific Objectives:
${seq.specificObjectives.map((obj) => `${obj.roman}. ${sanitizeText(obj.description)}`).join('\n')}

${seq.digitalResources ? `Digital Resources:\n${sanitizeText(seq.digitalResources)}\n` : ''}
${seq.complementaryResources ? `Complementary Resources:\n${sanitizeText(seq.complementaryResources)}\n` : ''}
${seq.knowledgeTests ? `Knowledge Tests:\n${sanitizeText(seq.knowledgeTests)}\n` : ''}
`
  )
  .join('\n')}

${data.finalEvaluation ? `Evaluation finale:\n${sanitizeText(data.finalEvaluation)}` : ''}

Generated on ${new Date().toLocaleDateString('fr-FR')}
Pedagogical Model: ${sanitizeText(data.pedagogicalModel)}
  `.trim();

  return Buffer.from(content, 'utf-8');
}
