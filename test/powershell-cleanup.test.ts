import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';

describe('PowerShell child cleanup', () => {
  it.runIf(isWindows)('does not leak the persistent PowerShell child after a quick CLI invocation', () => {
    const cliPath = resolve('dist/cjs/cli.js');
    const before = countOrphanPowerShells();
    const result = spawnSync(process.execPath, [cliPath, 'cpu'], { encoding: 'utf8', timeout: 30_000 });
    expect(result.status).toBe(0);
    const after = countOrphanPowerShells();
    expect(after).toBeLessThanOrEqual(before);
  });

  it.skipIf(isWindows)('skipped on non-Windows platforms', () => {
    expect(true).toBe(true);
  });
});

function countOrphanPowerShells(): number {
  const psList = spawnSync('powershell.exe', ['-NoProfile', '-Command', '(Get-Process powershell -ErrorAction SilentlyContinue | Measure-Object).Count'], {
    encoding: 'utf8',
    timeout: 10_000
  });
  return parseInt((psList.stdout || '0').trim(), 10) || 0;
}
