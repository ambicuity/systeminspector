import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parsePsAxoDarwin,
  parseSystemProfilerSPDisplays,
  parseSystemProfilerSPMemory
} from '../../src/parsers';

function fixture(...parts: string[]): string {
  return readFileSync(resolve('test/fixtures', ...parts), 'utf8');
}

describe('parsePsAxoDarwin', () => {
  it('parses real `ps -axo pid,user,pcpu,pmem,command -c` output', () => {
    const rows = parsePsAxoDarwin(fixture('darwin', 'ps', 'axo.txt'));
    expect(rows.length).toBeGreaterThan(0);
    const launchd = rows.find((r) => r.command === 'launchd');
    expect(launchd).toBeDefined();
    expect(launchd?.pid).toBe(1);
    expect(launchd?.user).toBe('root');

    // Every row must have a positive PID and reasonable cpu/mem percents.
    for (const row of rows) {
      expect(row.pid).toBeGreaterThan(0);
      expect(row.cpu).toBeGreaterThanOrEqual(0);
      expect(row.cpu).toBeLessThanOrEqual(800); // multi-core can exceed 100
      expect(row.mem).toBeGreaterThanOrEqual(0);
      expect(row.mem).toBeLessThanOrEqual(100);
      expect(row.user).toBeTruthy();
    }
  });
});

describe('parseSystemProfilerSPDisplays', () => {
  it('parses GPU metadata and attached displays from real Apple Silicon output', () => {
    const result = parseSystemProfilerSPDisplays(fixture('darwin', 'system_profiler', 'SPDisplaysDataType.txt'));
    expect(result.chipsetModel).toMatch(/Apple|Intel|AMD|NVIDIA/);
    expect(result.type).toBe('GPU');
    expect(result.bus).toBe('Built-In');
    expect(result.cores).toBeGreaterThan(0);
    expect(result.metalSupport).toMatch(/^Metal/);
    expect(result.displays.length).toBeGreaterThan(0);

    const main = result.displays.find((d) => d.main);
    expect(main).toBeDefined();
    expect(main?.resolution).toMatch(/\d+\s*x\s*\d+/);
    expect(main?.online).toBe(true);
  });
});

describe('parseSystemProfilerSPMemory', () => {
  it('parses on-package memory total / type / manufacturer (Apple Silicon)', () => {
    const result = parseSystemProfilerSPMemory(fixture('darwin', 'system_profiler', 'SPMemoryDataType.txt'));
    expect(result.total).toMatch(/\d+\s*[KMG]B/);
    expect(result.type).toBeTruthy();
    expect(result.manufacturer).toBeTruthy();
  });

  it('returns an empty object for empty input', () => {
    expect(parseSystemProfilerSPMemory('')).toEqual({});
  });
});
