export function parseKeyValueLines(input: string, separator = ':'): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of input.split(/\r?\n/)) {
    const index = line.indexOf(separator);
    if (index <= 0) {
      continue;
    }
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + separator.length).trim();
    if (key) {
      result[key] = value;
    }
  }
  return result;
}

export interface ParsedLscpu {
  architecture: string;
  modelName: string;
  vendorId: string;
  cpuMHz: number;
  cpus: number;
  coresPerSocket: number;
  sockets: number;
  flags: string;
}

export function parseLscpu(input: string): ParsedLscpu {
  const values = parseKeyValueLines(input);
  return {
    architecture: values.architecture || '',
    modelName: values['model name'] || values.model || '',
    vendorId: values['vendor id'] || '',
    cpuMHz: parseFloat(values['cpu mhz'] || values['cpu max mhz'] || '0') || 0,
    cpus: parseInt(values.cpu || values['cpu(s)'] || '0', 10) || 0,
    coresPerSocket: parseInt(values['core(s) per socket'] || '0', 10) || 0,
    sockets: parseInt(values.socket || values['socket(s)'] || '0', 10) || 0,
    flags: values.flags || ''
  };
}

export interface ParsedDfRow {
  filesystem: string;
  sizeKb: number;
  usedKb: number;
  availableKb: number;
  mount: string;
}

export function parseDf(input: string): ParsedDfRow[] {
  const rows = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return rows.slice(1).map((line) => {
    const parts = line.replace(/\s+/g, ' ').split(' ');
    return {
      filesystem: parts[0] || '',
      sizeKb: parseInt(parts[1] || '0', 10) || 0,
      usedKb: parseInt(parts[2] || '0', 10) || 0,
      availableKb: parseInt(parts[3] || '0', 10) || 0,
      mount: parts[parts.length - 1] || ''
    };
  });
}

export interface ParsedPsRow {
  pid: number;
  cpu: number;
  mem: number;
  command: string;
}

export function parsePsList(input: string): ParsedPsRow[] {
  const rows = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return rows.slice(1).map((line) => {
    const parts = line.replace(/\s+/g, ' ').split(' ');
    return {
      pid: parseInt(parts[0] || '0', 10) || 0,
      cpu: parseFloat(parts[1] || '0') || 0,
      mem: parseFloat(parts[2] || '0') || 0,
      command: parts.slice(3).join(' ')
    };
  });
}

export function parseNetstatConnections(input: string): number {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('tcp') || line.startsWith('udp')).length;
}

export function parseDockerPs(input: string): number {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1).length;
}
