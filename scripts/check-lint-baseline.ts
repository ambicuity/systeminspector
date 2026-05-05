#!/usr/bin/env tsx
/**
 * Ratchets Biome warnings against `.lint-warning-baseline`.
 *
 * Replaces the old shell-based "200-warning ceiling" in ci.yml with a
 * proper baseline file that can only ever ratchet down.
 *
 * Modes:
 *   default     — fail if current > baseline; print friendly nudge if
 *                 current < baseline
 *   --update    — overwrite the baseline with the current count (run
 *                 locally after fixing warnings to lock the improvement)
 *
 * Parses Biome's GitHub-style reporter rather than its JSON output
 * because the JSON shape isn't a stable contract across Biome versions,
 * but the `::warning` line format is well-known.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE_PATH = resolve(__dirname, '..', '.lint-warning-baseline');

function runBiome(): { warnings: number; errors: number; output: string } {
  let output = '';
  try {
    output = execSync('npx biome lint src/ test/ --reporter=summary', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (err) {
    // Biome exits non-zero on any error/warning. Capture the output.
    output = (err as { stdout?: string; stderr?: string }).stdout || (err as { stderr?: string }).stderr || '';
  }
  const warnMatch = /Found (\d+) warnings/.exec(output);
  const errMatch = /Found (\d+) errors/.exec(output);
  return {
    warnings: warnMatch ? Number.parseInt(warnMatch[1], 10) : 0,
    errors: errMatch ? Number.parseInt(errMatch[1], 10) : 0,
    output
  };
}

function readBaseline(): number {
  if (!existsSync(BASELINE_PATH)) {
    process.stderr.write(`Missing .lint-warning-baseline at repo root.\nRun \`npm run lint:baseline\` to create one.\n`);
    process.exit(1);
  }
  const raw = readFileSync(BASELINE_PATH, 'utf8').trim();
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    process.stderr.write(`.lint-warning-baseline contains an invalid value: ${JSON.stringify(raw)}\n`);
    process.exit(1);
  }
  return n;
}

function main(): void {
  const update = process.argv.includes('--update');
  const { warnings, errors } = runBiome();

  if (errors > 0) {
    process.stderr.write(`Biome found ${errors} lint error(s) — these block CI regardless of the warning baseline. Fix them first.\n`);
    process.exit(2);
  }

  if (update) {
    writeFileSync(BASELINE_PATH, `${warnings}\n`);
    process.stdout.write(`Updated .lint-warning-baseline to ${warnings}.\n`);
    return;
  }

  const baseline = readBaseline();
  if (warnings > baseline) {
    process.stderr.write(
      `Lint warnings rose from ${baseline} (baseline) to ${warnings}.\n` +
        `Fix the new warnings, or — if intentional — run \`npm run lint:baseline\` to update the baseline and document why in your PR.\n`
    );
    process.exit(1);
  }
  if (warnings < baseline) {
    process.stdout.write(
      `Lint warnings dropped from ${baseline} (baseline) to ${warnings}. ` +
        `Run \`npm run lint:baseline\` to lock in the improvement.\n`
    );
    return;
  }
  process.stdout.write(`Lint warnings: ${warnings} (matches baseline).\n`);
}

main();
