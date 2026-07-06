import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pdfPath = process.argv[2];

if (!pdfPath) {
  console.error('Usage: node scripts/debug-pdf-parse.mjs /path/to/resume.pdf');
  process.exit(1);
}

const buffer = readFileSync(resolve(pdfPath));
console.log('[debug] buffer bytes:', buffer.length);

async function testImport(label, importer) {
  try {
    const pdfParse = await importer();
    const result = await pdfParse(buffer);
    console.log(`[debug] ${label} success`, {
      extractedTextLength: (result.text ?? '').trim().length,
      preview: (result.text ?? '').trim().slice(0, 120),
    });
  } catch (error) {
    console.error(`[debug] ${label} error`, {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
  }
}

await testImport('pdf-parse (package entry)', async () => {
  const mod = await import('pdf-parse');
  return mod.default ?? mod;
});

await testImport('pdf-parse/lib/pdf-parse.js', async () => {
  const mod = await import('pdf-parse/lib/pdf-parse.js');
  return mod.default ?? mod;
});
