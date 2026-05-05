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

export interface ParsedDiskutilRow {
  identifier: string;
  type: string;
  name: string;
  size: string;
}

/**
 * Parse `diskutil list` output (macOS).
 *
 * Each disk has a header (`/dev/disk0 (internal, physical):`) followed by
 * a column-aligned table:
 *
 *     #:                       TYPE NAME                    SIZE       IDENTIFIER
 *     0:      GUID_partition_scheme                        *500.3 GB   disk0
 *     1:                        EFI EFI                     314.6 MB   disk0s1
 *
 * We return a flat list of partition rows across all disks, skipping
 * headers and "Physical Store" lines (which describe APFS containers).
 */
export function parseDiskutilList(input: string): ParsedDiskutilRow[] {
  const rows: ParsedDiskutilRow[] = [];
  // TYPE is right-aligned in the header, NAME / SIZE / IDENTIFIER are left-aligned.
  // We derive the data column boundaries from the LEFT edge of NAME, SIZE, and
  // IDENTIFIER (where the columns start), and treat the TYPE column as
  // everything from the end of the row prefix up to NAME.
  let bounds: { typeEnd: number; sizeStart: number; identifierStart: number } | null = null;
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (/TYPE\s+NAME\s+SIZE\s+IDENTIFIER/.test(line)) {
      const nameStart = line.indexOf('NAME');
      const sizeStart = line.indexOf('SIZE', nameStart + 4);
      const identifierStart = line.indexOf('IDENTIFIER', sizeStart + 4);
      bounds = { typeEnd: nameStart, sizeStart, identifierStart };
      continue;
    }
    if (!bounds) continue;
    const prefix = /^(\s*\d+:\s*)/.exec(line);
    if (!prefix) continue;
    const type = line.slice(prefix[1].length, bounds.typeEnd).trim();
    const name = line.slice(bounds.typeEnd, bounds.sizeStart).trim();
    const size = line.slice(bounds.sizeStart, bounds.identifierStart).trim();
    const identifier = line.slice(bounds.identifierStart).trim();
    if (!identifier.startsWith('disk')) continue;
    rows.push({ type, name, size, identifier });
  }
  return rows;
}

export interface ParsedDfRowDarwin {
  filesystem: string;
  totalKb: number;
  usedKb: number;
  availableKb: number;
  capacity: number;
  mount: string;
}

/**
 * Parse `df -kP` output. macOS / BSD have 1024-byte blocks (kB) when -k
 * is set; -P forces a single-line POSIX format that is robust to long
 * filesystem names.
 *
 *     Filesystem    1024-blocks      Used Available Capacity  Mounted on
 *     /dev/disk3s1s1  482797652  12163828  38615968    24%    /
 */
export function parseDfDarwin(input: string): ParsedDfRowDarwin[] {
  const rows: ParsedDfRowDarwin[] = [];
  const lines = input.split(/\r?\n/);
  for (const raw of lines.slice(1)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 6) continue;
    const capacity = Number.parseInt(parts[4].replace('%', ''), 10);
    if (Number.isNaN(capacity)) continue;
    rows.push({
      filesystem: parts[0],
      totalKb: Number.parseInt(parts[1], 10) || 0,
      usedKb: Number.parseInt(parts[2], 10) || 0,
      availableKb: Number.parseInt(parts[3], 10) || 0,
      capacity,
      mount: parts.slice(5).join(' ')
    });
  }
  return rows;
}
