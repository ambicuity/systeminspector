import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseIfconfigDarwin, parseNetstatRoutes, parseRouteDarwin } from '../../src/parsers';

function fixture(...parts: string[]): string {
  return readFileSync(resolve('test/fixtures', ...parts), 'utf8');
}

describe('parseIfconfigDarwin', () => {
  it('parses an active wifi interface (en0)', () => {
    const result = parseIfconfigDarwin(fixture('darwin', 'ifconfig', 'en0.txt'));
    expect(result).toEqual({
      iface: 'en0',
      flags: ['UP', 'BROADCAST', 'SMART', 'RUNNING', 'SIMPLEX', 'MULTICAST'],
      mtu: 1500,
      mac: 'aa:bb:cc:dd:ee:ff',
      ip4: '192.168.1.10',
      ip4Netmask: '0xffffff00',
      ip4Broadcast: '192.168.1.255',
      ip6: ['fe80::1%en0', 'fd00::1'],
      status: 'active'
    });
  });

  it('parses the loopback interface (lo0) — no mac, no broadcast', () => {
    const result = parseIfconfigDarwin(fixture('darwin', 'ifconfig', 'lo0.txt'));
    expect(result).not.toBeNull();
    expect(result!.iface).toBe('lo0');
    expect(result!.flags).toContain('LOOPBACK');
    expect(result!.mac).toBeUndefined();
    // lo0 typically has 127.0.0.1
    expect(result!.ip4).toBe('127.0.0.1');
  });

  it('returns null for non-ifconfig input', () => {
    expect(parseIfconfigDarwin('totally unrelated text\nmore text')).toBeNull();
  });
});

describe('parseRouteDarwin', () => {
  it('parses default-route output into destination/gateway/iface', () => {
    const result = parseRouteDarwin(fixture('darwin', 'route', 'default.txt'));
    expect(result).toEqual({
      destination: 'default',
      gateway: '192.168.1.1',
      iface: 'en0',
      flags: ['UP', 'GATEWAY', 'DONE', 'STATIC', 'PRCLONING', 'GLOBAL']
    });
  });
});

describe('parseNetstatRoutes', () => {
  it('counts the routing-table rows in `netstat -rn -f inet`', () => {
    const count = parseNetstatRoutes(fixture('darwin', 'netstat', 'rn-inet.txt'));
    // The fixture's IPv4 table has at least the default + 127 routes
    expect(count).toBeGreaterThan(2);
    expect(count).toBeLessThan(50);
  });

  it('returns 0 for empty input', () => {
    expect(parseNetstatRoutes('')).toBe(0);
  });
});
