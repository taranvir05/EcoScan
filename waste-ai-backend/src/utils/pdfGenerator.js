/**
 * pdfGenerator.js
 *
 * Generates a Technical Computer Vision Waste Detection Report for EcoScan (YOLO11).
 * Report structure:
 *   Page 1  — Report Overview (Metadata, Scan Overview)
 *   Page 2  — Detection Visualization (Original vs Annotated image, Detection Summary)
 *   Page 3  — Class-Wise Detection Analysis (Dynamic table & Distribution Chart)
 *   Page 4  — Model & Detection Details (YOLO11 Architecture & Pipeline)
 *   Page 5+ — Detection Details / Technical Appendix (Complete Bounding Box Table)
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Colour & Typography Configuration ───────────────────────────────────────
const C = {
  primary:        '#10b981',  // EcoScan Emerald
  primaryDark:    '#059669',
  primaryLight:   '#ecfdf5',
  primaryBorder:  '#a7f3d0',
  accent:         '#0ea5e9',  // Sky Blue
  dark:           '#0f172a',  // Slate 900
  darkMid:        '#1e293b',  // Slate 800
  surface:        '#f8fafc',  // Slate 50
  surfaceAlt:     '#f1f5f9',  // Slate 100
  border:         '#e2e8f0',  // Slate 200
  muted:          '#64748b',  // Slate 500
  mutedLight:     '#94a3b8',  // Slate 400
  white:          '#ffffff',
  warning:        '#f59e0b',
  purple:         '#8b5cf6',
};

const CATEGORY_MAP = {
  plastic:   { label: 'Plastic',       color: '#10b981', classId: 4 },
  metal:     { label: 'Metal',         color: '#8b5cf6', classId: 2 },
  paper:     { label: 'Paper',         color: '#3b82f6', classId: 3 },
  glass:     { label: 'Glass',         color: '#f59e0b', classId: 1 },
  cardboard: { label: 'Cardboard',     color: '#d97706', classId: 0 },
  trash:     { label: 'General Trash', color: '#ef4444', classId: 5 },
};

const getCat = (type) => CATEGORY_MAP[(type || 'trash').toLowerCase()] || CATEGORY_MAP.trash;

// ─── Scan ID Generator ────────────────────────────────────────────────────────
function buildScanId(resultId, createdAt) {
  const dateStr = new Date(createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '');
  const suffix  = String(resultId).slice(-4).toUpperCase();
  return `EC-${dateStr}-${suffix}`;
}

// ─── Header / Footer ──────────────────────────────────────────────────────────
function stampHeaderFooter(doc, pageIndex, totalPages, scanId) {
  doc.switchToPage(pageIndex);
  doc.save();

  // Top header line (Pages 2+)
  if (pageIndex > 0) {
    doc.strokeColor(C.border).lineWidth(0.5).moveTo(50, 42).lineTo(545, 42).stroke();
    doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(9).text('EcoScan', 50, 26);
    doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('Computer Vision Waste Detection Report', 95, 27);
    doc.fillColor(C.muted).font('Helvetica').fontSize(8).text(`Report: ${scanId}`, 380, 27, { align: 'right', width: 165 });
  }

  // Bottom footer line
  doc.strokeColor(C.border).lineWidth(0.5).moveTo(50, 788).lineTo(545, 788).stroke();
  doc.fillColor(C.muted).font('Helvetica').fontSize(7).text('CONFIDENTIAL · ECOSCAN COMPUTER VISION REPORT (YOLO11)', 50, 800);
  doc.fillColor(C.muted).font('Helvetica').fontSize(7).text(`Page ${pageIndex + 1} of ${totalPages}`, 380, 800, { align: 'right', width: 165 });

  doc.restore();
}

// ─── Section Title Helper ─────────────────────────────────────────────────────
function sectionTitle(doc, text, y) {
  doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(15).text(text, 50, y);
  doc.strokeColor(C.primary).lineWidth(2.5).moveTo(50, y + 21).lineTo(130, y + 21).stroke();
  return y + 38;
}

// ─── Subsection Heading Helper ────────────────────────────────────────────────
function subHeading(doc, text, y, color) {
  doc.fillColor(color || C.dark).font('Helvetica-Bold').fontSize(9.5).text(text, 50, y);
  return y + 16;
}

// ─── Main PDF Generator ───────────────────────────────────────────────────────
const generatePDF = async (result, user, res) => {
  const detections = result.detections || [];
  const scanId     = buildScanId(result._id, result.createdAt);

  // Pre-computed statistics
  const totalObjects = detections.length;
  const uniqueTypes  = Array.from(new Set(detections.map(d => d.label || d.type || 'Unknown')));
  const avgConf      = totalObjects ? Math.round(detections.reduce((a, d) => a + (d.confidence || 0), 0) / totalObjects) : 0;
  const maxConf      = totalObjects ? Math.round(Math.max(...detections.map(d => d.confidence || 0))) : 0;

  // Class-wise statistics map
  const classStatsMap = {};
  detections.forEach(d => {
    const rawLabel = d.label || d.type || 'Unknown';
    const key = rawLabel.toLowerCase();
    if (!classStatsMap[key]) {
      classStatsMap[key] = { label: rawLabel, count: 0, totalConf: 0, maxConf: 0 };
    }
    classStatsMap[key].count++;
    classStatsMap[key].totalConf += (d.confidence || 0);
    classStatsMap[key].maxConf = Math.max(classStatsMap[key].maxConf, d.confidence || 0);
  });

  const classStatsList = Object.values(classStatsMap).map(cs => ({
    ...cs,
    avgConf: Math.round(cs.totalConf / cs.count),
    maxConf: Math.round(cs.maxConf),
    percentage: ((cs.count / (totalObjects || 1)) * 100).toFixed(1),
  })).sort((a, b) => b.count - a.count);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      doc.pipe(res);
      res.on('finish', () => { console.log('[PDF] Stream finished successfully.'); resolve(); });
      res.on('error',  (e) => { console.error('[PDF] Stream error:', e); reject(e); });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 1 — REPORT OVERVIEW
      // ══════════════════════════════════════════════════════════════════════
      // Left vertical accent bar
      doc.rect(0, 0, 16, 842).fill(C.primary);

      // Report type label
      doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(10).text('COMPUTER VISION DETECTION REPORT', 64, 155, { characterSpacing: 1.5 });

      // Main title
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(26)
         .text('EcoScan', 64, 175, { width: 460, lineGap: 4 });
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(26)
         .text('Computer Vision Waste', 64, 207, { width: 460, lineGap: 4 });
      doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(26)
         .text('Detection Report', 64, 239, { width: 460, lineGap: 4 });

      // Subtitle
      doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(11)
         .text('AI-Powered Multi-Object Material Detection', 64, 275, { width: 456 });

      // Divider line
      doc.strokeColor(C.border).lineWidth(1).moveTo(64, 296).lineTo(530, 296).stroke();

      // Status badge
      doc.roundedRect(64, 312, 148, 22, 4).fill(C.primaryLight);
      doc.fillColor(C.primaryDark).font('Helvetica-Bold').fontSize(8.5).text('✓  DETECTION SCAN COMPLETE', 74, 319);

      // Metadata card
      const metaY = 350;
      doc.roundedRect(64, metaY, 466, 235, 8).fill(C.surface).stroke(C.border);
      doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7.5).text('REPORT METADATA', 84, metaY + 16, { characterSpacing: 1 });
      doc.strokeColor(C.border).lineWidth(0.5).moveTo(84, metaY + 28).lineTo(512, metaY + 28).stroke();

      let rowY = metaY + 38;
      const drawMeta = (label, value) => {
        doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8.5).text(label, 84, rowY, { width: 160 });
        doc.fillColor(C.dark).font('Helvetica').fontSize(8.5).text(value, 244, rowY, { width: 270 });
        rowY += 21;
      };

      drawMeta('Report ID:',               scanId);
      drawMeta('Scan Date & Time:',        new Date(result.createdAt || Date.now()).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      drawMeta('Prepared For:',            user?.name || user?.email || 'EcoScan User');
      drawMeta('Detection Model:',         'YOLOv11 (Custom-Trained Weights)');
      drawMeta('Model Version:',           'v1.0 (5 Material Classes)');
      drawMeta('Total Objects Detected:',  String(totalObjects));
      drawMeta('Unique Material Classes:', String(uniqueTypes.length));
      drawMeta('Average Confidence:',      `${avgConf}%`);
      drawMeta('Highest Confidence:',      `${maxConf}%`);
      drawMeta('Inference Device:',        'CPU');

      // Scan Overview Box
      const overviewY = metaY + 250;
      doc.roundedRect(64, overviewY, 466, 85, 6).fill(C.surfaceAlt).stroke(C.border);
      doc.rect(64, overviewY, 4, 85).fill(C.darkMid);
      doc.fillColor(C.darkMid).font('Helvetica-Bold').fontSize(9).text('SCAN OVERVIEW', 78, overviewY + 12);
      doc.fillColor(C.dark).font('Helvetica').fontSize(8.5).text(
        'EcoScan analyzed the submitted image using a custom-trained YOLO11 object detection model. The model identified individual waste objects, assigned each object to one of five material classes, and estimated a confidence score for each detection.',
        78, overviewY + 28, { width: 438, lineGap: 3 }
      );

      // Prepared by footer note
      doc.fillColor(C.mutedLight).font('Helvetica').fontSize(8)
         .text('Prepared by EcoScan Computer Vision Detection Pipeline · Ultralytics YOLO11', 64, 755, { width: 466, align: 'center' });
      doc.fillColor(C.mutedLight).font('Helvetica').fontSize(7.5)
         .text('CONFIDENTIAL · FOR AI & TECHNICAL EVALUATION PURPOSES ONLY', 64, 768, { width: 466, align: 'center' });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 2 — DETECTION VISUALIZATION
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage();
      let cy = 60;
      cy = sectionTitle(doc, '1.  Detection Visualization', cy);

      // Side-by-side or stacked image views
      const imgW = 238, imgH = 175;
      doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8.5).text('ORIGINAL INPUT IMAGE', 50, cy, { characterSpacing: 0.5 });
      doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8.5).text('YOLO ANNOTATED OUTPUT', 308, cy, { characterSpacing: 0.5 });
      cy += 14;

      doc.roundedRect(50,  cy, imgW, imgH, 5).stroke(C.border);
      doc.roundedRect(308, cy, imgW, imgH, 5).stroke(C.border);

      // Render original image
      if (result.image) {
        const origPath = path.join(__dirname, '../../', result.image);
        if (fs.existsSync(origPath)) {
          try { doc.image(origPath, 52, cy + 2, { fit: [imgW - 4, imgH - 4], align: 'center', valign: 'center' }); }
          catch (_) { doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('Original image unavailable', 52, cy + 80, { width: imgW, align: 'center' }); }
        }
      }

      // Render annotated image
      if (result.annotatedImage && result.annotatedImage.trim()) {
        try {
          const buf = Buffer.from(result.annotatedImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(buf, 310, cy + 2, { fit: [imgW - 4, imgH - 4], align: 'center', valign: 'center' });
        } catch (_) {}
      } else if (result.image) {
        const origPath = path.join(__dirname, '../../', result.image);
        if (fs.existsSync(origPath)) {
          try { doc.image(origPath, 310, cy + 2, { fit: [imgW - 4, imgH - 4], align: 'center', valign: 'center' }); }
          catch (_) {}
        }
      }

      cy += imgH + 24;

      // Detection Summary Cards Block
      cy = subHeading(doc, 'DETECTION SUMMARY', cy, C.muted);
      const confStats = [
        { label: 'Total Objects',    value: String(totalObjects) },
        { label: 'Unique Classes',   value: String(uniqueTypes.length) },
        { label: 'Average Conf.',    value: `${avgConf}%` },
        { label: 'Highest Conf.',    value: `${maxConf}%` },
      ];
      const cW = 116, cH = 52, cGap = 7;
      confStats.forEach((s, i) => {
        const cX = 50 + i * (cW + cGap);
        doc.roundedRect(cX, cy, cW, cH, 5).fill(C.surface).stroke(C.border);
        doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7.5).text(s.label, cX + 6, cy + 10, { width: cW - 12, align: 'center', characterSpacing: 0.5 });
        doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(18).text(s.value, cX + 6, cy + 24, { width: cW - 12, align: 'center' });
      });

      cy += cH + 24;

      // Annotation notice
      doc.roundedRect(50, cy, 495, 45, 5).fill(C.primaryLight).stroke(C.primaryBorder);
      doc.fillColor(C.primaryDark).font('Helvetica-Bold').fontSize(8.5).text('MULTI-OBJECT BOUNDING BOX PRESERVATION', 62, cy + 10);
      doc.fillColor(C.dark).font('Helvetica').fontSize(8).text(
        'The annotated output displays bounding box coordinates, material class labels, and confidence percentages for all detected instances. Multi-object detection is preserved in full without artificial object suppression.',
        62, cy + 22, { width: 470, lineGap: 2 }
      );

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 3 — CLASS-WISE DETECTION ANALYSIS
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage();
      cy = 60;
      cy = sectionTitle(doc, '2.  Class-Wise Detection Analysis', cy);

      cy = subHeading(doc, 'MATERIAL CLASS BREAKDOWN TABLE', cy, C.muted);

      const tableCols = { mat: 120, count: 90, avg: 95, max: 95, pct: 95 };
      const tableHeaders = ['Material', 'Objects Detected', 'Average Confidence', 'Highest Confidence', 'Percentage'];

      // Header row
      doc.rect(50, cy, 495, 22).fill(C.darkMid);
      let tX = 50;
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
      [tableCols.mat, tableCols.count, tableCols.avg, tableCols.max, tableCols.pct].forEach((w, i) => {
        doc.text(tableHeaders[i], tX + 6, cy + 7, { width: w - 8, align: i === 0 ? 'left' : 'center' });
        tX += w;
      });
      cy += 22;

      // Table rows
      classStatsList.forEach((cs, i) => {
        doc.rect(50, cy, 495, 20).fill(i % 2 === 0 ? C.surface : C.white);
        const cat = getCat(cs.label);
        let rowX = 50;

        // Material with color dot
        doc.circle(rowX + 12, cy + 10, 3.5).fill(cat.color);
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text(cs.label, rowX + 22, cy + 6, { width: tableCols.mat - 24 });
        rowX += tableCols.mat;

        // Count
        doc.fillColor(C.dark).font('Helvetica').fontSize(8.5).text(String(cs.count), rowX + 6, cy + 6, { width: tableCols.count - 8, align: 'center' });
        rowX += tableCols.count;

        // Avg Conf
        doc.fillColor(C.dark).font('Helvetica').fontSize(8.5).text(`${cs.avgConf}%`, rowX + 6, cy + 6, { width: tableCols.avg - 8, align: 'center' });
        rowX += tableCols.avg;

        // Max Conf
        doc.fillColor(C.dark).font('Helvetica').fontSize(8.5).text(`${cs.maxConf}%`, rowX + 6, cy + 6, { width: tableCols.max - 8, align: 'center' });
        rowX += tableCols.max;

        // Percentage
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text(`${cs.percentage}%`, rowX + 6, cy + 6, { width: tableCols.pct - 8, align: 'center' });

        cy += 20;
      });

      // Total summary row
      doc.rect(50, cy, 495, 22).fill(C.surfaceAlt);
      doc.strokeColor(C.border).lineWidth(0.8).rect(50, cy, 495, 22).stroke();
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text('Total / Overall', 58, cy + 7, { width: tableCols.mat - 10 });
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text(String(totalObjects), 50 + tableCols.mat + 6, cy + 7, { width: tableCols.count - 8, align: 'center' });
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text(`${avgConf}%`, 50 + tableCols.mat + tableCols.count + 6, cy + 7, { width: tableCols.avg - 8, align: 'center' });
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text(`${maxConf}%`, 50 + tableCols.mat + tableCols.count + tableCols.avg + 6, cy + 7, { width: tableCols.max - 8, align: 'center' });
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text('100.0%', 50 + tableCols.mat + tableCols.count + tableCols.avg + tableCols.max + 6, cy + 7, { width: tableCols.pct - 8, align: 'center' });

      cy += 36;

      // Class Distribution Vector Bar Chart
      cy = subHeading(doc, 'CLASS DISTRIBUTION VISUALIZATION', cy, C.muted);
      doc.roundedRect(50, cy, 495, 95, 6).fill(C.surface).stroke(C.border);

      // Stacked distribution bar
      const barX = 66, barY = cy + 20, barWidth = 463, barHeight = 22;
      let currentX = barX;

      classStatsList.forEach((cs) => {
        const segW = (parseFloat(cs.percentage) / 100) * barWidth;
        if (segW > 0) {
          const cat = getCat(cs.label);
          doc.rect(currentX, barY, segW, barHeight).fill(cat.color);
          currentX += segW;
        }
      });

      // Chart Legend
      let legX = 66, legY = cy + 54;
      classStatsList.forEach((cs, i) => {
        const cat = getCat(cs.label);
        doc.circle(legX + 4, legY + 4, 3).fill(cat.color);
        doc.fillColor(C.dark).font('Helvetica').fontSize(8).text(`${cs.label} (${cs.percentage}%)`, legX + 12, legY, { width: 130 });
        legX += 145;
        if ((i + 1) % 3 === 0) {
          legX = 66;
          legY += 16;
        }
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 4 — MODEL / DETECTION DETAILS
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage();
      cy = 60;
      cy = sectionTitle(doc, '3.  Model & Detection Details', cy);

      cy = subHeading(doc, 'YOLO11 SPECIFICATION & METADATA', cy, C.muted);

      const modelSpecs = [
        ['Architecture',            'YOLO11 (Ultralytics)'],
        ['Material Classes (5)',    'Cardboard, Glass, Metal, Paper, Plastic'],
        ['Framework',               'Ultralytics YOLO (Python)'],
        ['Input Resolution',        'Standard Inference Scale (640 × 640)'],
        ['Confidence Threshold',    '0.25 (25% minimum prediction confidence)'],
        ['Inference Device',        'CPU'],
        ['Detection Method',        'Multi-object bounding-box region proposal'],
      ];

      modelSpecs.forEach(([label, val], i) => {
        const rowH = 22;
        doc.rect(50, cy, 495, rowH).fill(i % 2 === 0 ? C.surface : C.white);
        doc.strokeColor(C.border).lineWidth(0.4).rect(50, cy, 495, rowH).stroke();
        doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8.5).text(label, 62, cy + 6, { width: 190 });
        doc.fillColor(C.dark).font('Helvetica').fontSize(8.5).text(val, 260, cy + 6, { width: 275 });
        cy += rowH;
      });

      cy += 24;

      // Detection Methodology Explanation Box
      cy = subHeading(doc, 'DETECTION METHODOLOGY EXPLANATION', cy, C.muted);
      doc.roundedRect(50, cy, 495, 75, 6).fill(C.surface).stroke(C.border);
      doc.rect(50, cy, 4, 75).fill(C.primary);
      doc.fillColor(C.dark).font('Helvetica').fontSize(8.5).text(
        'Each detected object is represented by a bounding box, material class, and confidence score. Multiple objects of the same or different material classes can be detected within a single image.',
        64, cy + 16, { width: 466, lineGap: 3 }
      );
      doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(8).text(
        'Bounding box coordinates are normalized relative to the original image dimensions [x1, y1, x2, y2].',
        64, cy + 50, { width: 466 }
      );

      cy += 95;

      // Inference Pipeline Architecture Box
      cy = subHeading(doc, 'INFERENCE PIPELINE ARCHITECTURE', cy, C.muted);
      doc.roundedRect(50, cy, 495, 110, 6).fill(C.surfaceAlt).stroke(C.border);

      const steps = [
        { num: '01', title: 'Image Input', desc: 'Preprocesses input image into tensor format.' },
        { num: '02', title: 'Feature Extraction', desc: 'Passes tensors through YOLO11 backbone and FPN.' },
        { num: '03', title: 'Box & Class Regression', desc: 'Predicts bounding box coordinates and class probability.' },
        { num: '04', title: 'NMS & Thresholding', desc: 'Applies Non-Maximum Suppression at conf >= 0.25.' },
      ];

      const sW = 108, sH = 80, sGap = 8;
      steps.forEach((st, idx) => {
        const stX = 60 + idx * (sW + sGap);
        doc.roundedRect(stX, cy + 15, sW, sH, 4).fill(C.white).stroke(C.border);
        doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(11).text(st.num, stX + 8, cy + 23);
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8).text(st.title, stX + 8, cy + 38, { width: sW - 16 });
        doc.fillColor(C.muted).font('Helvetica').fontSize(7).text(st.desc, stX + 8, cy + 50, { width: sW - 16, lineGap: 1 });
      });

      // ══════════════════════════════════════════════════════════════════════
      // PAGE 5+ — DETECTION DETAILS / TECHNICAL APPENDIX
      // ══════════════════════════════════════════════════════════════════════
      doc.addPage();
      cy = 60;
      cy = sectionTitle(doc, '4.  Technical Appendix — Bounding Box Data', cy);

      const renderTableHeaders = (yPos) => {
        const bbH  = ['#', 'Material Class', 'Confidence', 'Bounding Box Coordinates (x1, y1, x2, y2)', 'Class ID'];
        const bbW  = [28, 115, 75, 207, 70];
        doc.rect(50, yPos, 495, 20).fill(C.darkMid);
        let bx = 50;
        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5);
        bbH.forEach((h, i) => {
          doc.text(h, bx + 5, yPos + 6, { width: bbW[i] - 6, align: i === 0 ? 'left' : 'center' });
          bx += bbW[i];
        });
        return yPos + 20;
      };

      cy = renderTableHeaders(cy);

      const bbW = [28, 115, 75, 207, 70];

      // Render ALL detections across pages without truncation
      detections.forEach((d, i) => {
        const rowH = 18;

        // Page overflow check — add page if reaching bottom margin
        if (cy + rowH > 740) {
          doc.addPage();
          cy = 60;
          cy = renderTableHeaders(cy);
        }

        doc.rect(50, cy, 495, rowH).fill(i % 2 === 0 ? C.surface : C.white);
        const cat = getCat(d.label || d.type);
        let bx2 = 50;

        // Index
        doc.fillColor(C.muted).font('Helvetica').fontSize(7.5).text(String(i + 1), bx2 + 5, cy + 5, { width: bbW[0] - 6, align: 'left' });
        bx2 += bbW[0];

        // Material Class
        doc.fillColor(cat.color).font('Helvetica-Bold').fontSize(7.5).text(d.label || d.type || 'Unknown', bx2 + 5, cy + 5, { width: bbW[1] - 6, align: 'center' });
        bx2 += bbW[1];

        // Confidence
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(7.5).text(`${(d.confidence || 0).toFixed(1)}%`, bx2 + 5, cy + 5, { width: bbW[2] - 6, align: 'center' });
        bx2 += bbW[2];

        // Bounding Box
        const bboxTxt = d.bbox
          ? `[${Math.round(d.bbox.x1 ?? 0)}, ${Math.round(d.bbox.y1 ?? 0)}, ${Math.round(d.bbox.x2 ?? 0)}, ${Math.round(d.bbox.y2 ?? 0)}]`
          : '—';
        doc.fillColor(C.darkMid).font('Courier').fontSize(7).text(bboxTxt, bx2 + 5, cy + 5, { width: bbW[3] - 6, align: 'center' });
        bx2 += bbW[3];

        // Class ID
        doc.fillColor(C.muted).font('Helvetica').fontSize(7.5).text(String(cat.classId), bx2 + 5, cy + 5, { width: bbW[4] - 6, align: 'center' });

        cy += rowH;
      });

      cy += 20;

      // Report Disclaimer
      if (cy + 75 > 740) {
        doc.addPage();
        cy = 60;
      }

      doc.roundedRect(50, cy, 495, 75, 5).fill(C.surface).stroke(C.border);
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5).text('REPORT DISCLAIMER & VERIFICATION', 65, cy + 12);
      doc.fillColor(C.muted).font('Helvetica').fontSize(8).text(
        'This technical report is automatically generated by the EcoScan Computer Vision Pipeline using a custom-trained YOLOv11 object detection model. All bounding boxes, material class assignments, and confidence scores are computed dynamically from actual inference outputs.',
        65, cy + 26, { width: 462, lineGap: 3 }
      );

      // ── Apply headers & footers to all pages ───────────────────────────
      const range      = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        stampHeaderFooter(doc, i, totalPages, scanId);
      }

      doc.end();
      console.log(`[PDF] Computer Vision Report successfully generated for result ID ${result._id} (${totalPages} pages)`);

    } catch (err) {
      console.error('[PDF] Critical generation error:', err);
      reject(err);
    }
  });
};

module.exports = { generatePDF };
