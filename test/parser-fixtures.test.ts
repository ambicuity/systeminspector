import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { parseDf, parseDockerPs, parseLscpu, parseNetstatConnections, parsePsList } from '../src/parsers';

describe('parser fixtures', () => {
  it('parses Ubuntu lscpu output', () => {
    const fixture = readFileSync('test/fixtures/linux/lscpu/ubuntu-22.txt', 'utf8');
    expect(parseLscpu(fixture)).toEqual({
      architecture: 'x86_64',
      modelName: 'Intel(R) Core(TM) i7-1185G7 @ 3.00GHz',
      vendorId: 'GenuineIntel',
      cpuMHz: 1800,
      cpus: 8,
      coresPerSocket: 4,
      sockets: 1,
      flags: 'fpu vme de pse tsc msr pae mce cx8 apic sep mtrr'
    });
  });

  it('parses df output', () => {
    const fixture = readFileSync('test/fixtures/linux/df/sample.txt', 'utf8');
    const parsed = parseDf(fixture);
    expect(parsed[0].filesystem).toBe('/dev/sda1');
    expect(parsed[0].sizeKb).toBe(10240000);
    expect(parsed[1].mount).toBe('/run');
  });

  it('parses ps output', () => {
    const fixture = readFileSync('test/fixtures/linux/ps/sample.txt', 'utf8');
    const parsed = parsePsList(fixture);
    expect(parsed).toHaveLength(2);
    expect(parsed[1].pid).toBe(222);
    expect(parsed[1].command).toBe('node server.js');
  });

  it('counts netstat connections', () => {
    const fixture = readFileSync('test/fixtures/linux/netstat/sample.txt', 'utf8');
    expect(parseNetstatConnections(fixture)).toBe(2);
  });

  it('counts docker ps rows', () => {
    const fixture = readFileSync('test/fixtures/linux/docker/ps.txt', 'utf8');
    expect(parseDockerPs(fixture)).toBe(1);
  });
});
