import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import * as si from '../src/index';

describe('SystemInspector Static API', () => {
  it('should have a time function that returns a valid timestamp', () => {
    const timeData = si.time();
    expect(timeData).toBeDefined();
    expect(typeof timeData.current).toBe('number');
  });
  
  it('should successfully retrieve osInfo', async () => {
    const os = await si.osInfo();
    expect(os).toBeDefined();
    expect(typeof os.platform).toBe('string');
  });

  it('should expose non-breaking diagnostics helpers', () => {
    expect(Array.isArray(si.diagnostics())).toBe(true);
    si.clearDiagnostics();
    expect(si.diagnostics()).toEqual([]);
  });

  it('should not use deprecated Get-WmiObject in source code', () => {
    const files = ['src/battery.ts', 'src/filesystem.ts'];
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(source).not.toContain('Get-WmiObject');
  });

  it('should export version function', () => {
    const v = si.version();
    expect(typeof v).toBe('string');
    expect(v).toBe('1.0.0');
  });

  it('should expose cpu function that returns valid data', async () => {
    const cpuData = await si.cpu();
    expect(cpuData).toBeDefined();
    expect(typeof cpuData.manufacturer).toBe('string');
    expect(typeof cpuData.cores).toBe('number');
  });
});
