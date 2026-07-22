import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildTailoredResumeFilename,
  createTailoredResumeDocxBlob,
  createTailoredResumeTextBlob,
  DOCX_MIME_TYPE,
  downloadBlob,
  ResumeExportError,
  validateDocxBlob,
} from './export-tailored-resume';

interface BrowserMocks {
  anchor: {
    click: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  appendChild: ReturnType<typeof vi.fn>;
  cleanupCallbacks: Array<() => void>;
  createObjectURL: ReturnType<typeof vi.fn>;
  revokeObjectURL: ReturnType<typeof vi.fn>;
}

function installBrowserMocks(): BrowserMocks {
  const cleanupCallbacks: Array<() => void> = [];
  const anchor = {
    href: '',
    download: '',
    rel: '',
    style: { display: '' },
    click: vi.fn(),
    remove: vi.fn(),
  };
  const appendChild = vi.fn();
  const createObjectURL = vi.fn(
    (_blob: Blob) => `blob:resume-${createObjectURL.mock.calls.length}`
  );
  const revokeObjectURL = vi.fn();

  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  vi.stubGlobal('document', {
    createElement: vi.fn(() => anchor),
    body: { appendChild },
  });
  vi.stubGlobal('window', {
    setTimeout: vi.fn((callback: () => void) => {
      cleanupCallbacks.push(callback);
      return cleanupCallbacks.length;
    }),
  });

  return {
    anchor,
    appendChild,
    cleanupCallbacks,
    createObjectURL,
    revokeObjectURL,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DOCX generation', () => {
  it('creates a valid, non-empty DOCX blob with the correct MIME type', async () => {
    const blob = await createTailoredResumeDocxBlob(
      'PROFESSIONAL SUMMARY\nReliable engineer\n\nEXPERIENCE\n- Built resilient exports'
    );
    const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());

    expect(blob.type).toBe(DOCX_MIME_TYPE);
    expect(blob.size).toBeGreaterThan(0);
    expect(Array.from(signature)).toEqual([0x50, 0x4b, 0x03, 0x04]);
    await expect(validateDocxBlob(blob)).resolves.toBeUndefined();
  });

  it.each([[''], ['   '], [null], [undefined]])(
    'rejects missing résumé content: %s',
    async (content) => {
      await expect(
        createTailoredResumeDocxBlob(content as unknown as string)
      ).rejects.toMatchObject({
        name: 'ResumeExportError',
        code: 'MISSING_RESUME_CONTENT',
      });
    }
  );

  it('rejects an empty generated document', async () => {
    await expect(
      validateDocxBlob(new Blob([], { type: DOCX_MIME_TYPE }))
    ).rejects.toMatchObject({
      name: 'ResumeExportError',
      code: 'EMPTY_DOCUMENT',
    });
  });

  it('rejects a malformed generated document', async () => {
    const malformed = new Blob(['not a zip'], { type: DOCX_MIME_TYPE });

    await expect(validateDocxBlob(malformed)).rejects.toMatchObject({
      name: 'ResumeExportError',
      code: 'INVALID_DOCUMENT',
    });
  });
});

describe('export filenames', () => {
  it('removes unsafe characters and always returns a DOCX filename', () => {
    const filename = buildTailoredResumeFilename(
      'docx',
      'Acme / <North>:*?',
      'Senior | Engineer. '
    );

    expect(filename).toBe(
      'ReplayAI_Acme_North_Senior_Engineer_Tailored_Resume.docx'
    );
    expect(filename).not.toMatch(/[<>:"/\\|?*\u0000-\u001f]/);
  });

  it('uses a safe fallback when filename parts are unusable', () => {
    expect(buildTailoredResumeFilename('docx', '///', '***')).toBe(
      'ReplayAI_Tailored_Resume.docx'
    );
  });
});

describe('browser download handling', () => {
  it('starts a download before cleaning up the object URL', () => {
    const mocks = installBrowserMocks();
    const blob = new Blob(['download'], { type: DOCX_MIME_TYPE });

    downloadBlob(blob, 'ReplayAI_Tailored_Resume.docx');

    expect(mocks.appendChild).toHaveBeenCalledOnce();
    expect(mocks.anchor.click).toHaveBeenCalledOnce();
    expect(mocks.revokeObjectURL).not.toHaveBeenCalled();
    expect(mocks.anchor.remove).not.toHaveBeenCalled();

    mocks.cleanupCallbacks[0]();
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:resume-1');
    expect(mocks.anchor.remove).toHaveBeenCalledOnce();
  });

  it('supports repeated download attempts with independent object URLs', () => {
    const mocks = installBrowserMocks();
    const blob = new Blob(['download'], { type: DOCX_MIME_TYPE });

    downloadBlob(blob, 'ReplayAI_Tailored_Resume.docx');
    downloadBlob(blob, 'ReplayAI_Tailored_Resume.docx');

    expect(mocks.createObjectURL).toHaveBeenCalledTimes(2);
    expect(mocks.anchor.click).toHaveBeenCalledTimes(2);
    expect(mocks.cleanupCallbacks).toHaveLength(2);
  });

  it('returns a structured error when the browser cannot start the download', () => {
    const mocks = installBrowserMocks();
    mocks.createObjectURL.mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() =>
      downloadBlob(
        new Blob(['download'], { type: DOCX_MIME_TYPE }),
        'ReplayAI_Tailored_Resume.docx'
      )
    ).toThrowError(
      expect.objectContaining<Partial<ResumeExportError>>({
        name: 'ResumeExportError',
        code: 'DOWNLOAD_FAILED',
      })
    );
  });
});

describe('other export formats', () => {
  it('keeps the existing text export behavior intact', async () => {
    const blob = createTailoredResumeTextBlob('Résumé content');

    expect(blob.type).toBe('text/plain;charset=utf-8');
    expect(await blob.text()).toBe('Résumé content');
  });
});
