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

export interface ParsedIfconfigDarwin {
  iface: string;
  flags: string[];
  mtu: number;
  mac?: string;
  ip4?: string;
  ip4Netmask?: string;
  ip4Broadcast?: string;
  ip6?: string[];
  status?: 'active' | 'inactive' | 'unknown';
}

/**
 * Parse a single-interface `ifconfig <iface>` output (macOS / BSD format).
 *
 * Header line shape:
 *   en0: flags=8863<UP,BROADCAST,SMART,...> mtu 1500
 *
 * Followed by tab-indented lines:
 *   ether aa:bb:cc:dd:ee:ff
 *   inet 192.168.1.10 netmask 0xffffff00 broadcast 192.168.1.255
 *   inet6 fe80::1%en0 prefixlen 64 ...
 *   status: active
 */
export function parseIfconfigDarwin(input: string): ParsedIfconfigDarwin | null {
  const lines = input.split(/\r?\n/);
  const headerMatch = /^(\S+?):\s+flags=\d+<([^>]*)>(?:\s+mtu\s+(\d+))?/.exec(lines[0] || '');
  if (!headerMatch) return null;
  const result: ParsedIfconfigDarwin = {
    iface: headerMatch[1],
    flags: headerMatch[2] ? headerMatch[2].split(',').filter(Boolean) : [],
    mtu: Number.parseInt(headerMatch[3] || '0', 10) || 0,
    ip6: []
  };
  for (const raw of lines.slice(1)) {
    const line = raw.trim();
    let m: RegExpExecArray | null;
    if ((m = /^ether\s+([0-9a-f:]{17})/i.exec(line))) {
      result.mac = m[1];
    } else if ((m = /^inet\s+(\d{1,3}(?:\.\d{1,3}){3})(?:\s+netmask\s+(\S+))?(?:\s+broadcast\s+(\S+))?/.exec(line))) {
      result.ip4 = m[1];
      if (m[2]) result.ip4Netmask = m[2];
      if (m[3]) result.ip4Broadcast = m[3];
    } else if ((m = /^inet6\s+([0-9a-f:]+(?:%\S+)?)/i.exec(line))) {
      result.ip6!.push(m[1]);
    } else if ((m = /^status:\s+(\S+)/.exec(line))) {
      result.status = m[1] === 'active' || m[1] === 'inactive' ? (m[1] as 'active' | 'inactive') : 'unknown';
    }
  }
  if (!result.ip6!.length) delete result.ip6;
  return result;
}

export interface ParsedRouteDarwin {
  destination: string;
  gateway: string;
  iface: string;
  flags?: string[];
}

/**
 * Parse `route -n get default` output (macOS).
 *
 * Format is a label/value table:
 *   destination: default
 *      gateway: 192.168.1.1
 *    interface: en0
 *        flags: <UP,GATEWAY,DONE,STATIC,...>
 */
export function parseRouteDarwin(input: string): ParsedRouteDarwin | null {
  const values = parseKeyValueLines(input);
  if (!values.destination || !values.gateway || !values.interface) return null;
  const flagsMatch = /<([^>]*)>/.exec(values.flags || '');
  return {
    destination: values.destination,
    gateway: values.gateway,
    iface: values.interface,
    flags: flagsMatch ? flagsMatch[1].split(',').filter(Boolean) : []
  };
}

/**
 * Count routing-table rows in `netstat -rn` output. (Distinct from
 * parseNetstatConnections which counts established TCP/UDP sockets.)
 */
export function parseNetstatRoutes(input: string): number {
  let count = 0;
  let inTable = false;
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^Destination\s+Gateway/.test(line)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line) {
      inTable = false;
      continue;
    }
    count++;
  }
  return count;
}

export interface ParsedHardwarePort {
  hardwarePort: string;
  device: string;
  ethernetAddress: string;
}

/**
 * Parse `networksetup -listallhardwareports` output (macOS).
 *
 * Sequence of stanzas separated by blank lines:
 *
 *   Hardware Port: Wi-Fi
 *   Device: en0
 *   Ethernet Address: 02:00:00:00:00:04
 */
export function parseNetworksetupHardwarePorts(input: string): ParsedHardwarePort[] {
  const ports: ParsedHardwarePort[] = [];
  let current: Partial<ParsedHardwarePort> = {};
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      if (current.hardwarePort && current.device && current.ethernetAddress) {
        ports.push(current as ParsedHardwarePort);
      }
      current = {};
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = /^Hardware Port:\s+(.+)$/.exec(line))) current.hardwarePort = m[1].trim();
    else if ((m = /^Device:\s+(\S+)/.exec(line))) current.device = m[1];
    else if ((m = /^Ethernet Address:\s+(\S+)/.exec(line))) current.ethernetAddress = m[1];
  }
  if (current.hardwarePort && current.device && current.ethernetAddress) {
    ports.push(current as ParsedHardwarePort);
  }
  return ports;
}

export interface ParsedAirportNetwork {
  ssid: string | null;
  associated: boolean;
}

/**
 * Parse `networksetup -getairportnetwork <iface>` output (macOS).
 *
 * Two shapes:
 *   "Current Wi-Fi Network: <SSID>"
 *   "You are not associated with an AirPort network."
 */
export function parseNetworksetupAirportNetwork(input: string): ParsedAirportNetwork {
  const trimmed = input.trim();
  const m = /^Current Wi-Fi Network:\s+(.+)$/m.exec(trimmed);
  if (m) return { ssid: m[1].trim(), associated: true };
  return { ssid: null, associated: false };
}

export interface ParsedAirportPower {
  iface: string;
  on: boolean;
}

/**
 * Parse `networksetup -getairportpower <iface>` output (macOS).
 *
 *   "Wi-Fi Power (en0): On"
 *   "Wi-Fi Power (en0): Off"
 */
export function parseNetworksetupAirportPower(input: string): ParsedAirportPower | null {
  const m = /Wi-Fi Power\s*\((\S+?)\):\s*(On|Off)/i.exec(input);
  if (!m) return null;
  return { iface: m[1], on: /on/i.test(m[2]) };
}
