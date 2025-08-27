// scripts/ai-fix.mjs
// Usage: node scripts/ai-fix.mjs build.log
// Reads the build log, asks OpenAI for a UNIFIED DIFF patch, applies it.

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(0); // don't fail the job just because key is missing
}

const logPath = process.argv[2] || 'build.log';
const buildLog = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';

const SYSTEM = `
You are a senior TypeScript/Next.js/Node engineer. 
Given the repository structure and the provided Vercel build log, produce a SMALL, SAFE fix.

Return ONLY a unified diff (patch) with paths relative to repo root.
Rules:
- Prefer minimal, targeted changes.
- Do not rename or remove large folders unless necessary.
- If config option is wrong (e.g., next.config, tsconfig, postcss), correct it.
- If a missing type/package is the cause, add it to package.json (dependencies or devDependencies) in the patch.
- If the error is caused by ESM/CJS mismatch for config files, rename to .cjs if needed (include that rename in the diff).
- If the issue is missing Suspense around useSearchParams in app router, wrap the component accordingly.
- If you cannot confidently fix, return an EMPTY diff.
Format: standard unified diff starting with lines '--- ' and '+++ '.

IMPORTANT:
- No commentary, no markdown fences. Only the diff.
`;

const USER = `
Repo context: Next.js app deployed on Vercel.
Build log (truncated to first 5000 chars):

${buildLog.slice(0, 5000)}
`;

async function askOpenAI(sys, user) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    console.error('OpenAI error:', res.status, t.slice(0, 300));
    return '';
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

function applyPatch(patch) {
  if (!patch || !patch.includes('\n+++ ')) {
    console.log('No patch content returned by AI.');
    return false;
  }
  fs.writeFileSync('ai-fix.patch', patch, 'utf8');
  try {
    execSync('git apply --whitespace=fix ai-fix.patch', { stdio: 'inherit' });
    console.log('Patch applied successfully.');
    return true;
  } catch (err) {
    console.error('git apply failed. Trying with -p0...');
    try {
      execSync('git apply -p0 --whitespace=fix ai-fix.patch', { stdio: 'inherit' });
      console.log('Patch applied with -p0.');
      return true;
    } catch (e2) {
      console.error('Failed to apply patch:', e2.message);
      return false;
    }
  }
}

const patch = await askOpenAI(SYSTEM, USER);
const ok = applyPatch(patch);
if (!ok) {
  // No changes applied; exit gracefully (job will continue)
  process.exit(0);
}
