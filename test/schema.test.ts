import { describe, expect, it } from 'vitest';
import { getSchema } from '../src/schema';

describe('schema catalog', () => {
  it('contains core trusted schemas', () => {
    const root = getSchema();
    const keys = Object.keys((root.properties || {}) as Record<string, unknown>);
    expect(keys).toEqual(
      expect.arrayContaining([
        'CpuData',
        'MemData',
        'OsData',
        'FsSizeData',
        'NetworkInterfacesData',
        'ProcessesData',
        'DiskLayoutData',
        'GraphicsData',
        'StaticData',
        'DynamicData',
        'AllData',
        'CapabilityRecord',
        'DiagnosticRecord',
        'InspectEnvelope'
      ])
    );
  });

  it('matches schema snapshot shape', () => {
    expect(getSchema()).toMatchSnapshot();
  });
});
