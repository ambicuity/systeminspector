import { describe, expect, it } from 'vitest';
import * as si from '../src/index';

const REQUIRED_EXPORTS = [
  'audio', 'baseboard', 'battery', 'bios', 'blockDevices', 'bluetoothDevices',
  'capabilities', 'capability', 'chassis', 'clearDiagnostics', 'cpu', 'cpuCache',
  'cpuCurrentSpeed', 'cpuFlags', 'cpuTemperature', 'currentLoad', 'diagnostics',
  'diskLayout', 'disksIO', 'dockerAll', 'dockerContainerProcesses',
  'dockerContainerStats', 'dockerContainers', 'dockerImages', 'dockerInfo',
  'dockerVolumes', 'fsOpenFiles', 'fsSize', 'fsStats', 'fullLoad', 'get',
  'getAllData', 'getDynamicData', 'getSchema', 'getStaticData', 'graphics',
  'inetChecksite', 'inetLatency', 'mem', 'memLayout', 'networkConnections',
  'networkGatewayDefault', 'networkInterfaceDefault', 'networkInterfaces',
  'networkStats', 'observe', 'onDiagnostic', 'osInfo', 'powerShellRelease',
  'powerShellStart', 'printer', 'processLoad', 'processes', 'schemaVersion',
  'select', 'services', 'shell', 'system', 'time', 'usb', 'users', 'uuid',
  'vboxInfo', 'version', 'versions', 'wifiConnections', 'wifiInterfaces',
  'wifiNetworks', 'watch'
];

describe('public API shape', () => {
  it.each(REQUIRED_EXPORTS)('exports %s as a function', (name) => {
    expect(typeof (si as any)[name]).toBe('function');
  });

  it('exports exactly the documented surface (no surprise additions or removals)', () => {
    const present = Object.keys(si).sort();
    const expected = REQUIRED_EXPORTS.slice().sort();
    expect(present).toEqual(expected);
  });
});
