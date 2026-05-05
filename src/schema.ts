import type { JsonSchema } from './types';

export const SCHEMA_VERSION = '1.1';

const baseSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  additionalProperties: true
};

const schemas: Record<string, JsonSchema> = {
  MemData: {
    ...baseSchema,
    title: 'MemData',
    type: 'object',
    properties: {
      total: { type: 'number' },
      free: { type: 'number' },
      used: { type: 'number' },
      active: { type: 'number' },
      available: { type: 'number' },
      swaptotal: { type: 'number' },
      swapused: { type: 'number' }
    }
  },
  OsData: {
    ...baseSchema,
    title: 'OsData',
    type: 'object',
    properties: {
      platform: { type: 'string' },
      distro: { type: 'string' },
      release: { type: 'string' },
      arch: { type: 'string' },
      hostname: { type: 'string' }
    }
  },
  FsSizeData: {
    ...baseSchema,
    title: 'FsSizeData',
    type: 'object',
    properties: {
      fs: { type: 'string' },
      type: { type: 'string' },
      size: { type: 'number' },
      used: { type: 'number' },
      use: { type: 'number' },
      mount: { type: 'string' }
    }
  },
  NetworkInterfacesData: {
    ...baseSchema,
    title: 'NetworkInterfacesData',
    type: 'object',
    properties: {
      iface: { type: 'string' },
      ip4: { type: 'string' },
      ip6: { type: 'string' },
      mac: { type: 'string' },
      internal: { type: 'boolean' },
      default: { type: 'boolean' }
    }
  },
  ProcessesData: {
    ...baseSchema,
    title: 'ProcessesData',
    type: 'object',
    properties: {
      all: { type: 'number' },
      running: { type: 'number' },
      blocked: { type: 'number' },
      sleeping: { type: 'number' },
      list: { type: 'array', items: { type: 'object' } }
    }
  },
  DiskLayoutData: {
    ...baseSchema,
    title: 'DiskLayoutData',
    type: 'object',
    properties: {
      device: { type: 'string' },
      type: { type: 'string' },
      name: { type: 'string' },
      vendor: { type: 'string' },
      size: { type: 'number' },
      bytesPerSector: { type: 'number' }
    }
  },
  GraphicsData: {
    ...baseSchema,
    title: 'GraphicsData',
    type: 'object',
    properties: {
      controllers: { type: 'array', items: { type: 'object' } },
      displays: { type: 'array', items: { type: 'object' } }
    }
  },
  DockerSummary: {
    ...baseSchema,
    title: 'DockerSummary',
    type: 'array'
  },
  StaticData: {
    ...baseSchema,
    title: 'StaticData',
    type: 'object',
    properties: {
      version: { type: 'string' },
      system: { type: 'object' },
      bios: { type: 'object' },
      baseboard: { type: 'object' },
      chassis: { type: 'object' },
      os: { type: 'object' },
      uuid: { type: 'object' },
      versions: { type: 'object' },
      cpu: { type: 'object' }
    }
  },
  DynamicData: {
    ...baseSchema,
    title: 'DynamicData',
    type: 'object',
    properties: {
      time: { type: 'object' },
      cpuCurrentSpeed: { type: 'object' },
      users: { type: 'array' },
      processes: { type: 'object' },
      currentLoad: { type: 'object' },
      mem: { type: 'object' },
      fsSize: { type: 'array' }
    }
  },
  AllData: {
    ...baseSchema,
    title: 'AllData',
    type: 'object',
    properties: {
      version: { type: 'string' },
      system: { type: 'object' },
      os: { type: 'object' },
      cpu: { type: 'object' },
      mem: { type: 'object' }
    }
  },
  CpuData: {
    ...baseSchema,
    title: 'CpuData',
    type: 'object',
    properties: {
      manufacturer: { type: 'string' },
      brand: { type: 'string' },
      cores: { type: 'number' },
      physicalCores: { type: 'number' },
      speed: { type: 'number' },
      flags: { type: 'string' },
      cache: { type: 'object' }
    }
  },
  CapabilityRecord: {
    ...baseSchema,
    title: 'CapabilityRecord',
    type: 'object',
    properties: {
      function: { type: 'string' },
      supported: { type: 'boolean' },
      platform: { type: 'string' },
      requiredTools: { type: 'array', items: { type: 'string' } },
      availableTools: { type: 'array', items: { type: 'string' } },
      permissionsRequired: { type: 'boolean' },
      confidence: { enum: ['high', 'medium', 'low'] }
    }
  },
  DiagnosticRecord: {
    ...baseSchema,
    title: 'DiagnosticRecord',
    type: 'object',
    properties: {
      id: { type: 'string' },
      functionName: { type: 'string' },
      module: { type: 'string' },
      platform: { type: 'string' },
      severity: { enum: ['info', 'warning', 'error'] },
      code: { type: 'string' },
      message: { type: 'string' },
      timestamp: { type: ['string', 'number'] },
      durationMs: { type: 'number' }
    }
  },
  InspectEnvelope: {
    ...baseSchema,
    title: 'InspectEnvelope',
    type: 'object',
    properties: {
      schemaVersion: { type: 'string' },
      data: {},
      diagnostics: { type: 'array', items: { $ref: '#/$defs/DiagnosticRecord' } },
      durationMs: { type: 'number' },
      source: { type: 'string' },
      platform: { type: 'string' },
      confidence: { enum: ['high', 'medium', 'low'] }
    }
  }
};

export function schemaVersion(): string {
  return SCHEMA_VERSION;
}

export function getSchema(name?: string): JsonSchema {
  if (name && schemas[name]) {
    return schemas[name];
  }
  return {
    ...baseSchema,
    title: name || 'SystemInspectorSchemas',
    type: 'object',
    properties: Object.fromEntries(Object.keys(schemas).map((schemaName) => [schemaName, schemas[schemaName]]))
  };
}
