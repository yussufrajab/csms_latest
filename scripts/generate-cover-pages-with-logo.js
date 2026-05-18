const fs = require('fs');
const path = require('path');

const docsDir = '/home/latest/docs';
const coversDir = '/home/latest/docs/covers';
const logoPath = '/home/latest/smz-logo-removebg-preview.png';

// Read and encode logo once
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');

// Helper function to convert filename to readable title
function formatTitle(filename) {
  let title = filename.replace(/\.md$/, '');
  title = title.replace(/[_-]/g, ' ');
  title = title.replace(/\s+v(\d+)$/i, ' (Version $1)');
  title = title.replace(/Phase(\d+)/gi, 'Phase $1');

  const acronyms = ['UAT', 'HRIMS', 'RBAC', 'API', 'CSRF', 'UI', 'UX', 'SDD', 'SRS', 'CSMS', 'PHOTO', 'STORAGE', 'SYSTEM'];

  title = title.split(' ').map((word, index) => {
    if (word.length === 0) return word;
    if (acronyms.includes(word.toUpperCase())) {
      return word.toUpperCase();
    }
    const lowercaseWords = ['and', 'or', 'for', 'with', 'without', 'the', 'a', 'an', 'of', 'to', 'in', 'on', 'at'];
    if (index > 0 && lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');

  title = title.replace(/Ui[\s\/]?Ux/gi, 'UI/UX');
  title = title.replace(/\baapanel\b/gi, 'aaPanel');
  title = title.replace(/\bpm2\b/gi, 'PM2');
  title = title.replace(/\bk6\b/gi, 'k6');

  return title;
}

// Helper function to determine document type category
function getDocType(filename) {
  const lower = filename.toLowerCase();

  if (lower.includes('security') || lower.includes('csrf') || lower.includes('audit')) {
    return 'Security Documentation';
  } else if (lower.includes('test') || lower.includes('uat') || lower.includes('quality')) {
    return 'Testing & Quality Assurance';
  } else if (lower.includes('design') || lower.includes('architecture')) {
    return 'Design & Architecture';
  } else if (lower.includes('user') || lower.includes('manual') || lower.includes('guide') || lower.includes('training')) {
    return 'User Documentation';
  } else if (lower.includes('business') || lower.includes('requirement')) {
    return 'Business Requirements';
  } else if (lower.includes('risk')) {
    return 'Risk Management';
  } else if (lower.includes('project') || lower.includes('plan') || lower.includes('report')) {
    return 'Project Management';
  } else if (lower.includes('deployment') || lower.includes('installation') || lower.includes('operation')) {
    return 'Operations & Deployment';
  } else if (lower.includes('implementation') || lower.includes('optimization')) {
    return 'Technical Implementation';
  } else {
    return 'Technical Documentation';
  }
}

// Helper function to get version from filename
function getVersion(filename) {
  const versionMatch = filename.match(/[_\s]v?(\d+)\.md$/i);
  if (versionMatch) {
    return versionMatch[1] + '.0';
  }
  return '1.0';
}

// Generate HTML cover page with embedded logo
function generateCoverPage(filename) {
  const title = formatTitle(filename);
  const docType = getDocType(filename);
  const version = getVersion(filename);

  // Split long titles for better display
  let titleLines = title;
  if (title.length > 40) {
    const words = title.split(' ');
    const mid = Math.ceil(words.length / 2);
    titleLines = words.slice(0, mid).join(' ') + '<br>' + words.slice(mid).join(' ');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Cover Page</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: white;
            color: #1a1a1a;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 0;
            position: relative;
            overflow: hidden;
        }

        .decorative-elements {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        .color-strip-top {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 12mm;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0ea5e9 100%);
        }

        .color-strip-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 8mm;
            background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #1e3a8a 100%);
        }

        .side-accent {
            position: absolute;
            left: 0;
            top: 12mm;
            width: 4mm;
            height: calc(100% - 20mm);
            background: linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%);
        }

        .geometric-pattern {
            position: absolute;
            top: 50%;
            right: 10mm;
            width: 150px;
            height: 150px;
            opacity: 0.05;
            transform: translateY(-50%) rotate(15deg);
        }

        .content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            padding: 25mm 20mm 20mm 25mm;
        }

        .header {
            text-align: center;
            padding-bottom: 10mm;
        }

        .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
        }

        .logo {
            width: 140px;
            height: auto;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }

        .organization {
            font-size: 16px;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
            font-weight: 700;
            color: #1e3a8a;
            line-height: 1.4;
        }

        .department {
            font-size: 13px;
            letter-spacing: 1.5px;
            margin-bottom: 5px;
            font-weight: 600;
            color: #3b82f6;
            text-transform: uppercase;
        }

        .sub-department {
            font-size: 11px;
            letter-spacing: 1px;
            margin-bottom: 20px;
            font-weight: 400;
            color: #6b7280;
            font-style: italic;
        }

        .main-content {
            text-align: center;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 20mm 0;
        }

        .doc-type {
            font-size: 14px;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 25px;
            font-weight: 500;
            color: #6b7280;
            position: relative;
        }

        .doc-type::before,
        .doc-type::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 60px;
            height: 1px;
            background: #cbd5e1;
        }

        .doc-type::before {
            right: calc(100% + 20px);
        }

        .doc-type::after {
            left: calc(100% + 20px);
        }

        .doc-title {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            line-height: 1.2;
            color: #1e3a8a;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .project-name {
            font-size: 24px;
            margin-bottom: 35px;
            font-weight: 400;
            letter-spacing: 1.5px;
            color: #475569;
        }

        .project-acronym {
            font-size: 18px;
            font-weight: 600;
            color: #3b82f6;
            letter-spacing: 3px;
        }

        .decorative-box {
            width: 120px;
            height: 3px;
            background: linear-gradient(90deg, transparent, #3b82f6, transparent);
            margin: 25px auto;
        }

        .footer {
            text-align: center;
            border-top: 2px solid #e5e7eb;
            padding-top: 18px;
        }

        .metadata {
            display: flex;
            justify-content: space-around;
            margin-bottom: 18px;
            font-size: 11px;
        }

        .metadata-item {
            text-align: center;
            position: relative;
        }

        .metadata-item:not(:last-child)::after {
            content: '';
            position: absolute;
            right: -30px;
            top: 50%;
            transform: translateY(-50%);
            width: 1px;
            height: 30px;
            background: #cbd5e1;
        }

        .metadata-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #6b7280;
            margin-bottom: 6px;
            font-weight: 600;
        }

        .metadata-value {
            font-size: 13px;
            font-weight: bold;
            color: #1e3a8a;
        }

        .copyright {
            font-size: 9px;
            color: #6b7280;
            letter-spacing: 0.5px;
            line-height: 1.6;
        }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: 900;
            color: rgba(30, 58, 138, 0.02);
            letter-spacing: 10px;
            z-index: 5;
            pointer-events: none;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="decorative-elements">
        <div class="color-strip-top"></div>
        <div class="color-strip-bottom"></div>
        <div class="side-accent"></div>
        <svg class="geometric-pattern" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e3a8a" stroke-width="0.5"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="#3b82f6" stroke-width="0.5"/>
            <circle cx="50" cy="50" r="20" fill="none" stroke="#1e3a8a" stroke-width="0.5"/>
        </svg>
    </div>

    <div class="watermark">CSMS</div>

    <div class="content">
        <div class="header">
            <div class="logo-container">
                <img src="data:image/png;base64,${logoBase64}" alt="Serikali ya Mapinduzi ya Zanzibar" class="logo">
            </div>
            <div class="organization">Serikali ya Mapinduzi<br>Zanzibar</div>
            <div class="department">Civil Service Commission</div>
            <div class="sub-department">Tume ya Utumishi Serikalini</div>
        </div>

        <div class="main-content">
            <div class="doc-type">${docType}</div>
            <h1 class="doc-title">${titleLines}</h1>
            <div class="project-name">Civil Service Management System</div>
            <div class="project-acronym">(CSMS)</div>
            <div class="decorative-box"></div>
        </div>

        <div class="footer">
            <div class="metadata">
                <div class="metadata-item">
                    <div class="metadata-label">Version</div>
                    <div class="metadata-value">${version}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Classification</div>
                    <div class="metadata-value">Official</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Date</div>
                    <div class="metadata-value">February 2026</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Status</div>
                    <div class="metadata-value">Final</div>
                </div>
            </div>
            <div class="copyright">
                © 2026 Civil Service Commission, Revolutionary Government of Zanzibar.<br>
                All Rights Reserved. Haki Zote Zimehifadhiwa.
            </div>
        </div>
    </div>
</body>
</html>
`;
}

// Main function
function main() {
  console.log('Starting cover page generation with SMZ logo...\n');

  // Create covers directory if it doesn't exist
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }

  // Read all files from docs directory
  const files = fs.readdirSync(docsDir);

  let generatedCount = 0;
  let skippedCount = 0;

  files.forEach(file => {
    // Skip directories and non-markdown files
    const filePath = path.join(docsDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      skippedCount++;
      return;
    }

    if (!file.endsWith('.md')) {
      skippedCount++;
      return;
    }

    // Generate cover page
    const coverHtml = generateCoverPage(file);
    const coverFilename = file.replace(/\.md$/, '_Cover_Page_v2.html');
    const coverPath = path.join(coversDir, coverFilename);

    // Write cover page
    fs.writeFileSync(coverPath, coverHtml);
    console.log(`✓ Generated: ${coverFilename}`);
    generatedCount++;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ COMPLETE! Generated ${generatedCount} cover pages with SMZ logo`);
  console.log(`  Skipped ${skippedCount} items (directories/non-markdown files)`);
  console.log(`${'='.repeat(60)}\n`);
  console.log('All cover pages include:');
  console.log('  - Embedded SMZ logo (Serikali ya Mapinduzi ya Zanzibar)');
  console.log('  - Professional blue gradient design');
  console.log('  - Bilingual text (English & Swahili)');
  console.log('  - Tume ya Utumishi Serikalini');
  console.log('  - Metadata: Version, Classification, Date, Status');
  console.log('  - A4 print-ready format');
}

// Run the script
main();
