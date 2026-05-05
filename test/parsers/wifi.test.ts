import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseNetworksetupAirportNetwork,
  parseNetworksetupAirportPower,
  parseNetworksetupHardwarePorts
} from '../../src/parsers';

function fixture(...parts: string[]): string {
  return readFileSync(resolve('test/fixtures', ...parts), 'utf8');
}

describe('parseNetworksetupHardwarePorts', () => {
  it('parses each Hardware Port stanza into a typed record', () => {
    const ports = parseNetworksetupHardwarePorts(fixture('darwin', 'networksetup', 'listallhardwareports.txt'));
    expect(ports.length).toBeGreaterThanOrEqual(3);
    const wifi = ports.find((p) => p.hardwarePort === 'Wi-Fi');
    expect(wifi).toBeDefined();
    expect(wifi?.device).toBe('en0');
    expect(wifi?.ethernetAddress).toMatch(/^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i);

    // Every port must have all three fields populated.
    for (const port of ports) {
      expect(port.hardwarePort).toBeTruthy();
      expect(port.device).toBeTruthy();
      expect(port.ethernetAddress).toBeTruthy();
    }
  });
});

describe('parseNetworksetupAirportNetwork', () => {
  it('returns associated:false for "not associated" output', () => {
    const result = parseNetworksetupAirportNetwork(fixture('darwin', 'networksetup', 'getairportnetwork-en0.txt'));
    expect(result).toEqual({ ssid: null, associated: false });
  });

  it('returns associated:true with SSID for connected output', () => {
    const result = parseNetworksetupAirportNetwork('Current Wi-Fi Network: HomeBaseSSID\n');
    expect(result).toEqual({ ssid: 'HomeBaseSSID', associated: true });
  });
});

describe('parseNetworksetupAirportPower', () => {
  it('parses "On" state from real capture', () => {
    const result = parseNetworksetupAirportPower(fixture('darwin', 'networksetup', 'getairportpower-en0.txt'));
    expect(result).toEqual({ iface: 'en0', on: true });
  });

  it('parses "Off" state', () => {
    const result = parseNetworksetupAirportPower('Wi-Fi Power (en0): Off\n');
    expect(result).toEqual({ iface: 'en0', on: false });
  });

  it('returns null for unrelated input', () => {
    expect(parseNetworksetupAirportPower('totally unrelated')).toBeNull();
  });
});
