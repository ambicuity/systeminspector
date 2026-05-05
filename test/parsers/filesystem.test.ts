import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseDfDarwin, parseDiskutilList } from '../../src/parsers';

function fixture(...parts: string[]): string {
  return readFileSync(resolve('test/fixtures', ...parts), 'utf8');
}

describe('parseDiskutilList (macOS)', () => {
  it('parses the captured `diskutil list` output into partition rows', () => {
    const rows = parseDiskutilList(fixture('darwin', 'diskutil', 'list.txt'));
    // The fixture includes the system's APFS container; we expect at least
    // the standard Macintosh HD volume to be present.
    const macHd = rows.find((r) => r.name === 'Macintosh HD');
    expect(macHd).toBeDefined();
    expect(macHd?.type).toContain('APFS');
    expect(macHd?.identifier).toMatch(/^disk\d+s\d+/);

    // Every row's identifier must follow disk{N}(s{M})? format.
    for (const row of rows) {
      expect(row.identifier).toMatch(/^disk\d+/);
      expect(row.size).toMatch(/[KMGT]?B$/);
    }
  });

  it('skips header lines and Physical Store annotations', () => {
    const rows = parseDiskutilList(fixture('darwin', 'diskutil', 'list.txt'));
    expect(rows.find((r) => r.name === 'NAME')).toBeUndefined();
    expect(rows.find((r) => r.type === 'Physical Store')).toBeUndefined();
  });
});

describe('parseDfDarwin', () => {
  it('parses `df -kP` output with POSIX 1024-byte blocks', () => {
    const rows = parseDfDarwin(fixture('darwin', 'df', 'df-kP.txt'));
    // Root mount must be present and reflect a real filesystem.
    const root = rows.find((r) => r.mount === '/');
    expect(root).toBeDefined();
    expect(root?.filesystem).toMatch(/^\/dev\/disk/);
    expect(root?.totalKb).toBeGreaterThan(0);
    expect(root?.capacity).toBeGreaterThanOrEqual(0);
    expect(root?.capacity).toBeLessThanOrEqual(100);

    // Usage arithmetic should hold for every row.
    for (const row of rows) {
      expect(row.totalKb).toBeGreaterThanOrEqual(row.usedKb);
    }
  });
});
