import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  accuracyCheckToneClasses,
  resolveAccuracyCheckState,
} from './accuracy-check';

describe('resolveAccuracyCheckState', () => {
  it('reports no accuracy concerns for a completed check with no findings', () => {
    const state = resolveAccuracyCheckState({ warnings: [], reviewItems: [] });

    expect(state).toMatchObject({
      status: 'success',
      title: 'No accuracy concerns detected',
      description:
        'The tailored résumé appears consistent with the information provided.',
    });
  });

  it('recommends review when suggested claims need confirmation', () => {
    const state = resolveAccuracyCheckState({
      warnings: [],
      reviewItems: ['Confirm the Kubernetes experience before adding it.'],
    });

    expect(state).toMatchObject({
      status: 'warning',
      title: 'Review these claims',
    });
    expect(state.accessibleLabel).toContain('1 claim needs review');
  });

  it('reports potential unsupported claims as an error status', () => {
    const state = resolveAccuracyCheckState({
      warnings: ['The generated metric is not supported by the source résumé.'],
      reviewItems: [],
    });

    expect(state).toMatchObject({
      status: 'error',
      title: 'Potential unsupported claims detected',
      description:
        'Review or remove these statements before submitting the résumé.',
    });
    expect(state.accessibleLabel).toContain('1 potential unsupported claim');
  });

  it('does not treat a missing result as successful', () => {
    expect(resolveAccuracyCheckState({}).status).toBe('neutral');
  });

  it('does not treat a failed analysis as successful', () => {
    const state = resolveAccuracyCheckState({
      availability: 'unavailable',
      warnings: [],
      reviewItems: [],
    });

    expect(state).toMatchObject({
      status: 'neutral',
      title: 'Accuracy check unavailable',
    });
  });

  it('treats explicit empty arrays as a successful completed check', () => {
    const state = resolveAccuracyCheckState({
      availability: 'available',
      warnings: [],
      reviewItems: [],
    });

    expect(state.status).toBe('success');
  });

  it.each([
    { warnings: null, reviewItems: [] },
    { warnings: [], reviewItems: undefined },
    { warnings: [42], reviewItems: [] },
    { warnings: [], reviewItems: 'confirm this' },
  ])('treats malformed data as unavailable: %o', (input) => {
    expect(resolveAccuracyCheckState(input).status).toBe('neutral');
  });

  it('uses semantic theme tokens that remain readable in light mode', () => {
    expect(accuracyCheckToneClasses.success).toEqual({
      card: 'border-success/25 bg-success/[0.04]',
      icon: 'text-success',
    });
    expect(accuracyCheckToneClasses.warning.icon).toBe('text-warning');
    expect(accuracyCheckToneClasses.error.icon).toBe('text-destructive');
  });

  it('defines the semantic status colors for dark mode', () => {
    const globalStyles = readFileSync(
      new URL('../../app/globals.css', import.meta.url),
      'utf8'
    );
    const darkTheme = globalStyles.slice(globalStyles.indexOf('.dark {'));

    expect(darkTheme).toContain('--success:');
    expect(darkTheme).toContain('--warning:');
    expect(darkTheme).toContain('--destructive:');
  });

  it('provides accessible text labels for every status', () => {
    const states = [
      resolveAccuracyCheckState({ warnings: [], reviewItems: [] }),
      resolveAccuracyCheckState({ warnings: [], reviewItems: ['Review'] }),
      resolveAccuracyCheckState({ warnings: ['Unsupported'], reviewItems: [] }),
      resolveAccuracyCheckState({ availability: 'not_evaluated' }),
      resolveAccuracyCheckState({ availability: 'unavailable' }),
    ];

    for (const state of states) {
      expect(state.accessibleLabel).toMatch(/^Accuracy check: .+/);
      expect(state.title).not.toHaveLength(0);
      expect(state.description).not.toHaveLength(0);
    }
  });
});
