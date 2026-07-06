import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const edgeFunctionPath = resolve(
  'supabase/functions/ai_run_job_prep_interview_questions/index.ts'
);

const source = readFileSync(edgeFunctionPath, 'utf8');

const countsBlock = source.match(
  /const QUESTION_TYPE_COUNTS: Record<MvpQuestionType, number> = \{([\s\S]*?)\};/
);

const mvpTypesBlock = source.match(
  /const MVP_QUESTION_TYPES = \[([\s\S]*?)\] as const;/
);

if (!countsBlock || !mvpTypesBlock) {
  console.error('Could not parse interview question constants from edge function.');
  process.exit(1);
}

const counts = Object.fromEntries(
  [...countsBlock[1].matchAll(/(\w+):\s*(\d+)/g)].map(([, type, count]) => [type, Number(count)])
);

const mvpTypes = [...mvpTypesBlock[1].matchAll(/'([^']+)'/g)].map(([, type]) => type);

const total = mvpTypes.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
const sum = Object.values(counts).reduce((acc, count) => acc + count, 0);

console.log('[verify] configured question types:', mvpTypes);
console.log('[verify] QUESTION_TYPE_COUNTS:', counts);
console.log('[verify] derived target count:', total);
console.log('[verify] per-type sum:', sum);

if (sum !== total) {
  console.error(`[verify] FAILED: type counts sum to ${sum}, expected ${total}`);
  process.exit(1);
}

for (const type of mvpTypes) {
  if (!(type in counts)) {
    console.error(`[verify] FAILED: MVP type "${type}" missing from QUESTION_TYPE_COUNTS`);
    process.exit(1);
  }

  if ((counts[type] ?? 0) < 1) {
    console.error(`[verify] FAILED: MVP type "${type}" must have a count of at least 1`);
    process.exit(1);
  }
}

for (const type of Object.keys(counts)) {
  if (!mvpTypes.includes(type)) {
    console.error(
      `[verify] FAILED: QUESTION_TYPE_COUNTS includes "${type}" which is not in MVP_QUESTION_TYPES`
    );
    process.exit(1);
  }
}

if ('gap_risk' in counts) {
  console.error('[verify] FAILED: gap_risk should not be generated in MVP');
  process.exit(1);
}

if (total < 1) {
  console.error('[verify] FAILED: derived target count must be at least 1');
  process.exit(1);
}

console.log(
  `[verify] PASSED: edge function is configured for ${total} MVP questions across ${mvpTypes.length} types`
);
