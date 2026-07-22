import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const OBJECT_URL_CLEANUP_DELAY_MS = 60_000;

export type ResumeExportErrorCode =
  | 'MISSING_RESUME_CONTENT'
  | 'EMPTY_DOCUMENT'
  | 'INVALID_DOCUMENT'
  | 'DOWNLOAD_FAILED';

export class ResumeExportError extends Error {
  constructor(
    public readonly code: ResumeExportErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ResumeExportError';
  }
}

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
  const sanitized = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\s.]+|[_\s.]+$/g, '');

  return Array.from(sanitized).slice(0, 80).join('');
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
  assertResumeContent(resumeText);
  return new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
}

export function assertResumeContent(resumeText: string): void {
  if (typeof resumeText !== 'string' || !resumeText.trim()) {
    throw new ResumeExportError(
      'MISSING_RESUME_CONTENT',
      'The generated résumé is empty. Please regenerate it before downloading.'
    );
  }
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

export async function createTailoredResumeDocxBlob(
  resumeText: string
): Promise<Blob> {
  assertResumeContent(resumeText);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: buildDocxParagraphs(resumeText),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  await validateDocxBlob(blob);
  return blob;
}

export async function validateDocxBlob(blob: Blob): Promise<void> {
  if (blob.size === 0) {
    throw new ResumeExportError(
      'EMPTY_DOCUMENT',
      'The Word document was empty. Please try generating it again.'
    );
  }

  if (blob.type !== DOCX_MIME_TYPE) {
    throw new ResumeExportError(
      'INVALID_DOCUMENT',
      'The Word document could not be created in the expected format.'
    );
  }

  const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const hasZipSignature =
    signature.length === 4 &&
    signature[0] === 0x50 &&
    signature[1] === 0x4b &&
    signature[2] === 0x03 &&
    signature[3] === 0x04;

  if (!hasZipSignature) {
    throw new ResumeExportError(
      'INVALID_DOCUMENT',
      'The Word document was malformed. Please try generating it again.'
    );
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (blob.size === 0) {
    throw new ResumeExportError(
      'EMPTY_DOCUMENT',
      'The generated download was empty. Please try again.'
    );
  }

  let url: string | null = null;
  let anchor: HTMLAnchorElement | null = null;

  try {
    url = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } catch {
    if (url) {
      URL.revokeObjectURL(url);
    }
    anchor?.remove();
    throw new ResumeExportError(
      'DOWNLOAD_FAILED',
      'The browser could not start the download. Please check download permissions and try again.'
    );
  }

  window.setTimeout(() => {
    anchor?.remove();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, OBJECT_URL_CLEANUP_DELAY_MS);
}
