import QRCode from "qrcode";
import { PDFDocument, rgb } from "pdf-lib";
import { storagePut } from "./storage";

/**
 * Generate a PDF certificate with QR code
 */
export async function generateCertificatePDF(params: {
  userName: string;
  courseName: string;
  courseLevel: string;
  certificateCode: string;
  issuedAt: Date;
  verifyBaseUrl: string;
}): Promise<{ url: string; key: string }> {
  const { userName, courseName, courseLevel, certificateCode, issuedAt, verifyBaseUrl } = params;
  const verifyUrl = `${verifyBaseUrl}/verify-certificate?code=${certificateCode}`;
  
  try {
    // Create QR code
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 150,
      margin: 1,
    });

    // Convert data URL to buffer
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape

    // Set background color
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 842,
      height: 595,
      color: rgb(1, 0.95, 0.92), // Light cream background
    });

    // Add decorative border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: rgb(0.2, 0.4, 0.8), // Primary blue
      borderWidth: 3,
    });

    // Add inner decorative border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: 782,
      height: 535,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 1,
    });

    // Add title
    page.drawText("CERTIFICAT DE COMPLÉTION", {
      x: 200,
      y: 500,
      size: 36,
      color: rgb(0.2, 0.4, 0.8),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Add subtitle
    page.drawText("DigiLearn - Plateforme de Formation Certifiante", {
      x: 200,
      y: 460,
      size: 14,
      color: rgb(0.4, 0.4, 0.4),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Add decorative line
    page.drawLine({
      start: { x: 100, y: 430 },
      end: { x: 742, y: 430 },
      thickness: 1,
      color: rgb(0.2, 0.4, 0.8),
    });

    // Add main text
    page.drawText("Ceci certifie que", {
      x: 200,
      y: 380,
      size: 14,
      color: rgb(0.3, 0.3, 0.3),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Add student name
    page.drawText(userName.toUpperCase(), {
      x: 200,
      y: 340,
      size: 28,
      color: rgb(0.2, 0.4, 0.8),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Add completion text
    page.drawText("a complété avec succès la formation", {
      x: 200,
      y: 300,
      size: 14,
      color: rgb(0.3, 0.3, 0.3),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Add course name
    page.drawText(courseName, {
      x: 200,
      y: 260,
      size: 20,
      color: rgb(0.2, 0.4, 0.8),
      font: await pdfDoc.embedFont("Helvetica-Bold"),
    });

    // Add course level
    page.drawText(`Niveau: ${courseLevel}`, {
      x: 200,
      y: 225,
      size: 12,
      color: rgb(0.4, 0.4, 0.4),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Add completion date
    const formattedDate = issuedAt.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    page.drawText(`Délivré le ${formattedDate}`, {
      x: 200,
      y: 190,
      size: 12,
      color: rgb(0.4, 0.4, 0.4),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Add certificate code
    page.drawText(`Code: ${certificateCode}`, {
      x: 200,
      y: 155,
      size: 10,
      color: rgb(0.6, 0.6, 0.6),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Embed QR code
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(qrImage, {
      x: 680,
      y: 80,
      width: 120,
      height: 120,
    });

    // Add QR code label
    page.drawText("Vérifier le certificat", {
      x: 680,
      y: 65,
      size: 9,
      color: rgb(0.4, 0.4, 0.4),
      font: await pdfDoc.embedFont("Helvetica"),
    });

    // Add footer
    page.drawText(
      "Ce certificat est délivré par DigiLearn et valide l'accomplissement de la formation spécifiée ci-dessus.",
      {
        x: 50,
        y: 40,
        size: 9,
        color: rgb(0.5, 0.5, 0.5),
        font: await pdfDoc.embedFont("Helvetica"),
      }
    );

    // Save PDF to buffer
    const pdfBuffer = await pdfDoc.save();

    // Upload to S3
    const timestamp = Date.now();
    const fileKey = `certificates/${timestamp}-${certificateCode}.pdf`;
    const { url, key } = await storagePut(fileKey, pdfBuffer, "application/pdf");

    return { url, key };
  } catch (error) {
    console.error("[Certificate Generator] Error:", error);
    throw new Error("Failed to generate certificate PDF");
  }
}

/**
 * Generates a certificate as an SVG string that can be converted to PDF
 * or rendered directly. Includes a QR code for verification.
 */
export async function generateCertificateSVG(params: {
  userName: string;
  courseName: string;
  certificateCode: string;
  issuedAt: Date;
  verifyBaseUrl: string;
}): Promise<string> {
  const { userName, courseName, certificateCode, issuedAt, verifyBaseUrl } = params;
  const verifyUrl = `${verifyBaseUrl}/verify-certificate?code=${certificateCode}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1, color: { dark: "#3b4f8a", light: "#ffffff" } });
  const dateStr = issuedAt.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 842 595" width="842" height="595">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8f9ff"/>
      <stop offset="100%" stop-color="#eef1ff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3b4f8a"/>
      <stop offset="100%" stop-color="#2a7d6e"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="842" height="595" fill="url(#bg)"/>
  <!-- Border -->
  <rect x="20" y="20" width="802" height="555" rx="8" fill="none" stroke="url(#accent)" stroke-width="3"/>
  <rect x="30" y="30" width="782" height="535" rx="6" fill="none" stroke="#3b4f8a" stroke-width="0.5" opacity="0.3"/>
  <!-- Corner decorations -->
  <circle cx="50" cy="50" r="6" fill="#3b4f8a" opacity="0.2"/>
  <circle cx="792" cy="50" r="6" fill="#3b4f8a" opacity="0.2"/>
  <circle cx="50" cy="545" r="6" fill="#3b4f8a" opacity="0.2"/>
  <circle cx="792" cy="545" r="6" fill="#3b4f8a" opacity="0.2"/>
  <!-- Logo area -->
  <text x="421" y="80" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#3b4f8a" font-weight="bold">DigiLearn</text>
  <text x="421" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#6b7280" letter-spacing="3">PLATEFORME DE FORMATION CERTIFIANTE</text>
  <!-- Divider -->
  <line x1="300" y1="120" x2="542" y2="120" stroke="url(#accent)" stroke-width="2"/>
  <!-- Title -->
  <text x="421" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#1a1a2e" font-weight="bold">CERTIFICAT DE FORMATION</text>
  <!-- Subtitle -->
  <text x="421" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#6b7280">Ce certificat atteste que</text>
  <!-- Name -->
  <text x="421" y="260" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#3b4f8a" font-weight="bold">${escapeXml(userName)}</text>
  <line x1="200" y1="275" x2="642" y2="275" stroke="#3b4f8a" stroke-width="0.5" opacity="0.3"/>
  <!-- Course info -->
  <text x="421" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#6b7280">a complété avec succès la formation</text>
  <text x="421" y="350" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#1a1a2e" font-weight="bold">${escapeXml(courseName)}</text>
  <!-- Date -->
  <text x="421" y="395" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Délivré le ${dateStr}</text>
  <!-- QR Code -->
  <image x="361" y="415" width="120" height="120" href="${qrDataUrl}"/>
  <!-- Certificate code -->
  <text x="421" y="555" text-anchor="middle" font-family="monospace" font-size="9" fill="#9ca3af">${certificateCode}</text>
  <!-- Footer -->
  <text x="421" y="575" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#9ca3af">Vérifiez l'authenticité : ${escapeXml(verifyUrl)}</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * Convert SVG to a simple HTML page that can be printed as PDF
 */
export function generateCertificateHTML(svgContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
  svg { max-width: 100%; height: auto; }
</style>
</head>
<body>${svgContent}</body>
</html>`;
}

/**
 * Generate a unique certificate code
 */
export function generateCertificateCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}
