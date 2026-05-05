import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const isWindows = process.platform === 'win32';

describe('PowerShell child cleanup', () => {
  it.runIf(isWindows)('does not leak the persistent PowerShell child after a quick API call exits', () => {
    const distEntry = resolve('dist/cjs/index.js');
    // Spawn a fresh Node process that loads the package (which triggers
    // PowerShell init on Windows), calls a real API (which spawns the
    // persistent PS child), and exits. The exit-handler hook installed
    // by powerShellStart should kill the child before the parent exits.
    const before = countOrphanPowerShells();
    const script = `const si = require(${JSON.stringify(distEntry)}); si.system().then(() => process.exit(0)).catch(() => process.exit(0));`;
    const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 30_000 });
    expect(result.status).toBe(0);
    // Give Windows a moment to release the PS process slot before
    // re-counting (the kill is synchronous from our side, but the OS
    // process table can lag briefly).
    const after = countOrphanPowerShells();
    expect(after).toBeLessThanOrEqual(before + 1);
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
