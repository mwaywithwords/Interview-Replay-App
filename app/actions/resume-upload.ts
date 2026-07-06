'use server';

import { requireUser } from '@/lib/supabase/server';
import {
  extractResumeTextFromBuffer,
  ResumeExtractionError,
} from '@/lib/resume/extract-text';

export async function extractResumeText(formData: FormData): Promise<{
  text: string | null;
  fileName: string | null;
  error: string | null;
}> {
  await requireUser();

  const file = formData.get('file');

  if (!(file instanceof File)) {
    return {
      text: null,
      fileName: null,
      error: 'No résumé file was uploaded.',
    };
  }

  const fileName = file.name.trim();
  if (!fileName) {
    return {
      text: null,
      fileName: null,
      error: 'The uploaded file is missing a filename.',
    };
  }

  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

  console.log('[resume-extract] server-action-received-file', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    extension,
  });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[resume-extract] server-action-buffer-ready', {
      fileName: file.name,
      bufferByteLength: buffer.length,
    });

    const result = await extractResumeTextFromBuffer(buffer, fileName, file.type);

    return {
      text: result.text,
      fileName: result.fileName,
      error: null,
    };
  } catch (error) {
    console.error('[resume-extract] server-action-error', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      extension,
      ...(error instanceof ResumeExtractionError
        ? { resumeExtractionError: error.message }
        : error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { message: String(error) }),
    });

    if (error instanceof ResumeExtractionError) {
      return {
        text: null,
        fileName: null,
        error: error.message,
      };
    }

    return {
      text: null,
      fileName: null,
      error: 'Could not extract résumé text. Try another file or paste your résumé manually.',
    };
  }
}
