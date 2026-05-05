import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import * as si from '../src/index';
import { version as packageVersion } from '../package.json';

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
    expect(v).toBe(packageVersion);
  });

  it('should expose cpu function that returns valid data', async () => {
    const cpuData = await si.cpu();
    expect(cpuData).toBeDefined();
    expect(typeof cpuData.manufacturer).toBe('string');
    expect(typeof cpuData.cores).toBe('number');
  });

  it('should expose capability metadata', async () => {
    const caps = await si.capabilities({ timeoutMs: 1000 });
    expect(Array.isArray(caps)).toBe(true);
    const cpuCapability = await si.capability('cpu', { timeoutMs: 1000 });
    expect(cpuCapability.function).toBe('cpu');
    expect(typeof cpuCapability.supported).toBe('boolean');
    expect(Array.isArray(cpuCapability.requiredTools)).toBe(true);
  });

  it('should support non-breaking envelope mode for cpu', async () => {
    const envelope = await si.cpu({ envelope: true, timeoutMs: 5000 });
    expect(envelope.schemaVersion).toBe(si.schemaVersion());
    expect(envelope.platform).toBe(process.platform);
    expect(envelope.data).toBeDefined();
    expect(typeof envelope.durationMs).toBe('number');
    expect(Array.isArray(envelope.diagnostics)).toBe(true);
  });

  it('should support envelope mode for core high-use APIs', async () => {
    const memEnvelope = await si.mem({ envelope: true, timeoutMs: 5000 });
    expect(memEnvelope.schemaVersion).toBe(si.schemaVersion());
    const osEnvelope = await si.osInfo({ envelope: true, timeoutMs: 5000 });
    expect(osEnvelope.data.platform).toBeDefined();
    const staticEnvelope = await si.getStaticData({ envelope: true, timeoutMs: 5000 });
    expect(staticEnvelope.source).toBe('getStaticData');
  });

  it('should support diagnostics sinceLastCall and listeners', () => {
    si.clearDiagnostics();
    const seen: unknown[] = [];
    const unsubscribe = si.onDiagnostic((record) => seen.push(record));
    // pushDiagnostic is intentionally internal, so use clear/sinceLastCall to verify API shape.
    expect(si.diagnostics({ sinceLastCall: true })).toEqual([]);
    unsubscribe();
    expect(seen).toEqual([]);
  });

  it('should expose schema metadata', () => {
    expect(si.schemaVersion()).toMatch(/^\d+\.\d+/);
    const schema = si.getSchema('CpuData');
    expect(schema.title).toBe('CpuData');
    expect(schema.type).toBe('object');
    expect(si.getSchema('MemData').title).toBe('MemData');
    expect(si.getSchema('NetworkInterfacesData').title).toBe('NetworkInterfacesData');
  });

  it('should accept redaction options with envelope mode', async () => {
    const envelope = await si.cpu({ envelope: true, redact: true, timeoutMs: 5000 });
    expect(envelope.data).toBeDefined();
    expect(envelope.schemaVersion).toBe(si.schemaVersion());
  });

  it('should expose selector builder for get()', async () => {
    const data = await si.get({
      cpu: si.select().fields('manufacturer', 'cores').toString()
    });
    expect(data.cpu).toBeDefined();
  });
});
