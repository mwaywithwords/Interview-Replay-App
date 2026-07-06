import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

const RESUME_SECTION_HEADINGS = new Set([
  'summary',
  'professional summary',
  'profile',
  'experience',
  'work experience',
  'professional experience',
  'employment history',
  'education',
  'skills',
  'technical skills',
  'core competencies',
  'projects',
  'certifications',
  'licenses',
  'achievements',
  'awards',
  'volunteer',
  'volunteer experience',
  'interests',
  'languages',
  'publications',
  'references',
]);

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function buildTailoredResumeFilename(
  extension: 'docx' | 'txt',
  companyName?: string | null,
  roleTitle?: string | null
): string {
  const company = companyName ? sanitizeFilenamePart(companyName) : '';
  const role = roleTitle ? sanitizeFilenamePart(roleTitle) : '';

  if (company && role) {
    return `ReplayAI_${company}_${role}_Tailored_Resume.${extension}`;
  }

  return `ReplayAI_Tailored_Resume.${extension}`;
}

export function createTailoredResumeTextBlob(resumeText: string): Blob {
  return new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^[\s]*(?:[-•*–—]|\d+\.)\s+/, '').trim();
}

function isBulletLine(line: string): boolean {
  return /^[\s]*(?:[-•*–—]|\d+\.)\s+\S/.test(line);
}

function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || isBulletLine(trimmed)) {
    return false;
  }

  const normalized = trimmed.replace(/:$/, '').toLowerCase();
  if (RESUME_SECTION_HEADINGS.has(normalized)) {
    return true;
  }

  const lettersOnly = trimmed.replace(/[^A-Za-z]/g, '');
  return (
    lettersOnly.length >= 3 &&
    trimmed === trimmed.toUpperCase() &&
    /^[A-Z0-9][A-Z0-9\s/&,-]+$/.test(trimmed)
  );
}

function paragraphSpacing(isHeading: boolean) {
  return {
    before: isHeading ? 240 : 0,
    after: isHeading ? 120 : 160,
    line: 276,
  };
}

function buildDocxParagraphs(resumeText: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = resumeText.replace(/\r\n/g, '\n').split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun('')],
          spacing: { after: 120 },
        })
      );
      continue;
    }

    if (isSectionHeading(line)) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: paragraphSpacing(true),
          children: [
            new TextRun({
              text: line.trim().replace(/:$/, ''),
              bold: true,
              size: 24,
            }),
          ],
        })
      );
      continue;
    }

    if (isBulletLine(line)) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: paragraphSpacing(false),
          children: [
            new TextRun({
              text: stripBulletPrefix(line),
              size: 22,
            }),
          ],
        })
      );
      continue;
    }

    paragraphs.push(
      new Paragraph({
        spacing: paragraphSpacing(false),
        children: [
          new TextRun({
            text: line.trim(),
            size: 22,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

export async function createTailoredResumeDocxBlob(resumeText: string): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: buildDocxParagraphs(resumeText),
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}
