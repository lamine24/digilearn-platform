/**
 * Professional Template Export Module
 * Exports scenarios following the professional template structure (Modele_Scenarise_.docx)
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
      doc.fontSize(20).font('Helvetica-Bold').text('SYLLABUS SCÉNARISÉ DE MODULE', {
        align: 'center',
        underline: true,
      });

      doc.moveDown(0.5);

      // Module title in blue box
      doc.rect(50, doc.y, 495, 30).fillAndStroke('#003366', '#003366');
      doc.fontSize(14).font('Helvetica-Bold').fillColor('white').text(data.moduleTitle, 60, doc.y + 8, {
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
        ['Auteur', data.author || ''],
        ['Institution', data.institution || ''],
        ['Intitulé du module', data.moduleTitle],
        ['Unité d\'Enseignement', data.teachingUnit || ''],
        ['Niveau / Cycle', data.level || ''],
        ['Équivalence en crédits', data.credits ? data.credits.toString() : ''],
        ['Volume horaire total', `${data.totalHours} heures`],
        ['Pré-requis', data.prerequisites || 'Aucun'],
        ['Objectif général du cours', data.generalObjective],
        ['Objectifs spécifiques', data.specificObjectives.join('\n')],
        ['Résumé du cours', data.courseSummary],
        ['Ouvrages bibliographiques', data.bibliography ? data.bibliography.join('\n') : ''],
      ];

      drawTable(doc, tableData, 50, doc.y, 495);
      doc.moveDown(1);

      // ─── SECTION 2: COURSE SCENARIZATION ──────────────────────────
      doc.fontSize(12).font('Helvetica-Bold').text('2. SCÉNARISATION DU COURS', {
        underline: true,
      });
      doc.moveDown(0.5);

      // Draw sequences
      for (const sequence of data.sequences) {
        drawSequence(doc, sequence);
        doc.moveDown(0.5);
      }

      // Final evaluation
      if (data.finalEvaluation) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('white').rect(50, doc.y, 495, 25).fill('#CC6600');
        doc.fillColor('white').text(`Séance 10 – Évaluation finale et bilan du module`, 60, doc.y - 20);
        doc.fillColor('black');
        doc.moveDown(1.5);

        doc.fontSize(10).font('Helvetica').text(data.finalEvaluation, {
          width: 495,
          align: 'left',
        });
        doc.moveDown(0.5);

        doc.fontSize(9).font('Helvetica-Oblique').text('TH = TOTAL HEURE | H au total = Volume total', {
          width: 495,
        });
      }

      // ─── FOOTER ───────────────────────────────────────────────────
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('gray').text(
        `Généré le ${new Date(data.createdAt).toLocaleDateString('fr-FR')} | Modèle: ${data.pedagogicalModel}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw a table for module identification
 */
function drawTable(doc: any, data: string[][], x: number, y: number, width: number) {
  const cellHeight = 25;
  const labelWidth = 150;
  const valueWidth = width - labelWidth;

  let currentY = y;

  for (const row of data) {
    // Draw border
    doc.rect(x, currentY, width, cellHeight).stroke();

    // Label column
    doc.rect(x, currentY, labelWidth, cellHeight).fillAndStroke('#E0E0E0', 'black');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('black').text(row[0], x + 5, currentY + 5, {
      width: labelWidth - 10,
      height: cellHeight - 10,
      valign: 'center',
    });

    // Value column
    doc.rect(x + labelWidth, currentY, valueWidth, cellHeight).stroke();
    doc.fontSize(9).font('Helvetica').fillColor('black').text(row[1], x + labelWidth + 5, currentY + 5, {
      width: valueWidth - 10,
      height: cellHeight - 10,
      valign: 'top',
    });

    currentY += cellHeight;
  }

  // Move cursor below table
  doc.y = currentY;
}

/**
 * Draw a sequence section
 */
function drawSequence(doc: any, sequence: Sequence) {
  // Sequence header in blue
  doc.fontSize(11).font('Helvetica-Bold').fillColor('white').rect(50, doc.y, 495, 25).fill('#003366');
  doc.fillColor('white').text(
    `Séquence ${sequence.number} – Chapitre ${sequence.number} : ${sequence.title}`,
    60,
    doc.y - 20
  );
  doc.fillColor('black');
  doc.moveDown(1.5);

  // Duration info
  doc.fontSize(9).font('Helvetica-Oblique').text(
    `Durée : ${sequence.duration.weeks} semaine(s) | Contact direct : ${sequence.duration.directContact}h | Travail personnel estimé : ${sequence.duration.personalWork}h`,
    { width: 495 }
  );
  doc.moveDown(0.5);

  // Specific objectives heading
  doc.fontSize(10).font('Helvetica-Bold').text('Objectifs spécifiques de la séquence :');
  doc.moveDown(0.3);

  // Objectives table
  const objectivesTableData = sequence.specificObjectives.map((obj) => [obj.roman, obj.description]);
  drawObjectivesTable(doc, objectivesTableData);
  doc.moveDown(0.5);

  // Digital resources
  if (sequence.digitalResources) {
    doc.fontSize(10).font('Helvetica-Bold').text('Ressources numériques :');
    doc.fontSize(9).font('Helvetica').text(sequence.digitalResources, { width: 495 });
    doc.moveDown(0.3);
  }

  // Complementary resources
  if (sequence.complementaryResources) {
    doc.fontSize(10).font('Helvetica-Bold').text('Ressources complémentaires :');
    doc.fontSize(9).font('Helvetica-Oblique').text(
      '(Capsules audio/vidéo, liens Cyberlibris, webographie, bibliographie ciblée)',
      { width: 495 }
    );
    doc.fontSize(9).font('Helvetica').text(sequence.complementaryResources, { width: 495 });
    doc.moveDown(0.3);
  }

  // Knowledge tests
  if (sequence.knowledgeTests) {
    doc.fontSize(10).font('Helvetica-Bold').text(`Tests de connaissances – Chapitre ${sequence.number} :`);
    doc.fontSize(9).font('Helvetica').text(sequence.knowledgeTests, { width: 495 });
    doc.moveDown(0.3);
  }

  // Separator
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
}

/**
 * Draw objectives table
 */
function drawObjectivesTable(doc: any, data: string[][]) {
  const cellHeight = 20;
  const romanWidth = 40;
  const descriptionWidth = 455;

  let currentY = doc.y;

  for (const row of data) {
    // Roman numeral column
    doc.rect(50, currentY, romanWidth, cellHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('black').text(row[0], 55, currentY + 5, {
      width: romanWidth - 10,
      valign: 'center',
    });

    // Description column
    doc.rect(50 + romanWidth, currentY, descriptionWidth, cellHeight).stroke();
    doc.fontSize(9).font('Helvetica').fillColor('black').text(row[1], 55 + romanWidth, currentY + 5, {
      width: descriptionWidth - 10,
      valign: 'top',
    });

    currentY += cellHeight;
  }

  doc.y = currentY;
}

/**
 * Generate filename for professional export
 */
export function generateProfessionalExportFilename(moduleTitle: string): string {
  const sanitized = moduleTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const timestamp = new Date().toISOString().split('T')[0];
  return `scenario-professionnel-${sanitized}-${timestamp}.pdf`;
}
