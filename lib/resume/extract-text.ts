export const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const;

export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export type ResumeFileExtension = (typeof ALLOWED_RESUME_EXTENSIONS)[number];

const MIN_EXTRACTED_TEXT_LENGTH = 50;

export class ResumeExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeExtractionError';
  }
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return '';
  }

  return fileName.slice(dotIndex).toLowerCase();
}

function logResumeExtraction(stage: string, details: Record<string, unknown>) {
  console.log(`[resume-extract] ${stage}`, details);
}

function getRawErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export function validateResumeFile(
  fileName: string,
  mimeType: string,
  sizeBytes: number
): ResumeFileExtension {
  if (sizeBytes <= 0) {
    throw new ResumeExtractionError('The uploaded file is empty.');
  }

  if (sizeBytes > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new ResumeExtractionError('Résumé must be 5 MB or smaller.');
  }

  const extension = getFileExtension(fileName);
  if (!ALLOWED_RESUME_EXTENSIONS.includes(extension as ResumeFileExtension)) {
    throw new ResumeExtractionError(
      'Supported formats: PDF (.pdf), Word (.docx), and plain text (.txt).'
    );
  }

  if (
    mimeType &&
    !ALLOWED_RESUME_MIME_TYPES.includes(
      mimeType as (typeof ALLOWED_RESUME_MIME_TYPES)[number]
    ) &&
    mimeType !== 'application/octet-stream'
  ) {
    throw new ResumeExtractionError(
      'Unsupported file type. Upload a PDF, DOCX, or TXT résumé.'
    );
  }

  return extension as ResumeFileExtension;
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\u0000/g, '').trim();
}

function assertExtractedText(text: string): string {
  const normalized = normalizeExtractedText(text);

  if (!normalized) {
    throw new ResumeExtractionError(
      'No résumé text was found in this file. Try another file or paste your résumé manually.'
    );
  }

  return normalized;
}

function assertPdfHasSelectableText(text: string): string {
  const normalized = assertExtractedText(text);

  if (normalized.length < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new ResumeExtractionError(
      'This PDF appears to be a scanned image with no selectable text. Export a text-based PDF or paste your résumé manually.'
    );
  }

  const alphanumericCount = normalized.replace(/[^a-zA-Z0-9]/g, '').length;
  if (alphanumericCount < MIN_EXTRACTED_TEXT_LENGTH) {
    throw new ResumeExtractionError(
      'This PDF appears to be a scanned image with no selectable text. Export a text-based PDF or paste your résumé manually.'
    );
  }

  return normalized;
}

async function extractTxtText(buffer: Buffer): Promise<string> {
  return assertExtractedText(buffer.toString('utf8'));
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  logResumeExtraction('pdf-parser-selected', { parser: 'pdf-parse' });

  try {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    const extractedLength = (result.text ?? '').trim().length;

    logResumeExtraction('pdf-extraction-success', {
      extractedTextLength: extractedLength,
    });

    return assertPdfHasSelectableText(result.text ?? '');
  } catch (error) {
    logResumeExtraction('pdf-extraction-error', getRawErrorDetails(error));

    if (error instanceof ResumeExtractionError) {
      throw error;
    }

    throw new ResumeExtractionError(
      'Could not read this PDF. Try re-exporting it or paste your résumé instead.'
    );
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return assertExtractedText(result.value ?? '');
  } catch (error) {
    if (error instanceof ResumeExtractionError) {
      throw error;
    }

    throw new ResumeExtractionError(
      'Could not read this Word document. Save as .docx or paste your résumé instead.'
    );
  }
}

export async function extractResumeTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType = ''
): Promise<{ text: string; fileName: string }> {
  const extension = getFileExtension(fileName);

  logResumeExtraction('extract-start', {
    fileName,
    mimeType,
    extension,
    bufferByteLength: buffer.length,
  });

  const validatedExtension = validateResumeFile(fileName, mimeType, buffer.length);

  let text: string;
  switch (validatedExtension) {
    case '.txt':
      logResumeExtraction('parser-selected', { parser: 'utf8' });
      text = await extractTxtText(buffer);
      break;
    case '.pdf':
      text = await extractPdfText(buffer);
      break;
    case '.docx':
      logResumeExtraction('parser-selected', { parser: 'mammoth' });
      text = await extractDocxText(buffer);
      break;
    default:
      throw new ResumeExtractionError(
        'Supported formats: PDF (.pdf), Word (.docx), and plain text (.txt).'
      );
  }

  logResumeExtraction('extract-complete', {
    fileName,
    extractedTextLength: text.length,
  });

  return {
    text,
    fileName,
  };
}
