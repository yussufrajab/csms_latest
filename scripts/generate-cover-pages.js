const fs = require('fs');
const path = require('path');

const docsDir = '/home/latest/docs';
const coversDir = '/home/latest/docs/covers';

// Helper function to convert filename to readable title
function formatTitle(filename) {
  // Remove .md extension
  let title = filename.replace(/\.md$/, '');

  // Replace underscores and hyphens with spaces
  title = title.replace(/[_-]/g, ' ');

  // Handle version numbers (v1, v2, v3, V2, etc.)
  title = title.replace(/\s+v(\d+)$/i, ' (Version $1)');

  // Handle Phase numbers
  title = title.replace(/Phase(\d+)/gi, 'Phase $1');

  // Handle special acronyms and formatting
  const acronyms = ['UAT', 'HRIMS', 'RBAC', 'API', 'CSRF', 'UI', 'UX', 'SDD', 'SRS', 'CSMS', 'PHOTO', 'STORAGE', 'SYSTEM'];

  // Capitalize first letter of each word
  title = title.split(' ').map((word, index) => {
    if (word.length === 0) return word;

    // Check if this word is an acronym
    if (acronyms.includes(word.toUpperCase())) {
      return word.toUpperCase();
    }

    // Special handling for certain words that should be lowercase
    const lowercaseWords = ['and', 'or', 'for', 'with', 'without', 'the', 'a', 'an', 'of', 'to', 'in', 'on', 'at'];
    if (index > 0 && lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');

  // Fix specific cases
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

// Generate HTML cover page
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
            height: 15mm;
            background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%);
        }

        .color-strip-left {
            position: absolute;
            top: 0;
            left: 0;
            width: 8mm;
            height: 100%;
            background: #1e3a8a;
        }

        .accent-line {
            position: absolute;
            bottom: 30mm;
            left: 25mm;
            width: 160mm;
            height: 2px;
            background: #3b82f6;
        }

        .content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            padding: 50mm 25mm;
        }

        .header {
            text-align: center;
        }

        .logo-placeholder {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            border: 3px solid #1e3a8a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
            background: white;
            color: #1e3a8a;
        }

        .organization {
            font-size: 14px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-weight: 600;
            color: #1e3a8a;
        }

        .department {
            font-size: 12px;
            letter-spacing: 1px;
            margin-bottom: 30px;
            font-weight: 400;
            color: #4b5563;
        }

        .main-content {
            text-align: center;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .doc-type {
            font-size: 16px;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 20px;
            font-weight: 400;
            color: #6b7280;
        }

        .doc-title {
            font-size: 42px;
            font-weight: bold;
            margin-bottom: 15px;
            line-height: 1.2;
            color: #1e3a8a;
        }

        .project-name {
            font-size: 28px;
            margin-bottom: 40px;
            font-weight: 400;
            letter-spacing: 1px;
            color: #374151;
        }

        .divider {
            width: 100px;
            height: 3px;
            background: #3b82f6;
            margin: 30px auto;
        }

        .footer {
            text-align: center;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
        }

        .metadata {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            font-size: 12px;
        }

        .metadata-item {
            text-align: center;
        }

        .metadata-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
            margin-bottom: 5px;
        }

        .metadata-value {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a8a;
        }

        .copyright {
            font-size: 10px;
            color: #6b7280;
            letter-spacing: 1px;
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
        <div class="color-strip-left"></div>
        <div class="accent-line"></div>
    </div>

    <div class="content">
        <div class="header">
            <div class="logo-placeholder">RGoZ</div>
            <div class="organization">Revolutionary Government of Zanzibar</div>
            <div class="department">Civil Service Commission</div>
        </div>

        <div class="main-content">
            <div class="doc-type">${docType}</div>
            <h1 class="doc-title">${titleLines}</h1>
            <div class="project-name">Civil Service Management System (CSMS)</div>
            <div class="divider"></div>
        </div>

        <div class="footer">
            <div class="metadata">
                <div class="metadata-item">
                    <div class="metadata-label">Version</div>
                    <div class="metadata-value">${version}</div>
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
            <div class="copyright">© 2026 Civil Service Commission, Zanzibar. All Rights Reserved.</div>
        </div>
    </div>
</body>
</html>
`;
}

// Main function
function main() {
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
      console.log(`Skipping directory: ${file}`);
      skippedCount++;
      return;
    }

    if (!file.endsWith('.md')) {
      console.log(`Skipping non-markdown file: ${file}`);
      skippedCount++;
      return;
    }

    // Generate cover page
    const coverHtml = generateCoverPage(file);
    const coverFilename = file.replace(/\.md$/, '_Cover_Page.html');
    const coverPath = path.join(coversDir, coverFilename);

    // Write cover page
    fs.writeFileSync(coverPath, coverHtml);
    console.log(`✓ Generated: ${coverFilename}`);
    generatedCount++;
  });

  console.log(`\n✓ Complete! Generated ${generatedCount} cover pages`);
  console.log(`  Skipped ${skippedCount} items (directories/non-markdown files)`);
}

// Run the script
main();
