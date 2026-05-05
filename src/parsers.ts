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
    const ether = /^ether\s+([0-9a-f:]{17})/i.exec(line);
    if (ether) {
      result.mac = ether[1];
      continue;
    }
    const inet = /^inet\s+(\d{1,3}(?:\.\d{1,3}){3})(?:\s+netmask\s+(\S+))?(?:\s+broadcast\s+(\S+))?/.exec(line);
    if (inet) {
      result.ip4 = inet[1];
      if (inet[2]) result.ip4Netmask = inet[2];
      if (inet[3]) result.ip4Broadcast = inet[3];
      continue;
    }
    const inet6 = /^inet6\s+([0-9a-f:]+(?:%\S+)?)/i.exec(line);
    if (inet6) {
      result.ip6!.push(inet6[1]);
      continue;
    }
    const status = /^status:\s+(\S+)/.exec(line);
    if (status) {
      result.status = status[1] === 'active' || status[1] === 'inactive' ? (status[1] as 'active' | 'inactive') : 'unknown';
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
    const hp = /^Hardware Port:\s+(.+)$/.exec(line);
    if (hp) {
      current.hardwarePort = hp[1].trim();
      continue;
    }
    const dev = /^Device:\s+(\S+)/.exec(line);
    if (dev) {
      current.device = dev[1];
      continue;
    }
    const eth = /^Ethernet Address:\s+(\S+)/.exec(line);
    if (eth) {
      current.ethernetAddress = eth[1];
    }
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

export interface ParsedPsAxoRow {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
}

/**
 * Parse `ps -axo pid,user,pcpu,pmem,command -c` output (macOS).
 *
 *   PID USER              %CPU %MEM COMMAND
 *     1 root               1.1  0.2 launchd
 *
 * Differs from parsePsList (which expects 4 columns); this one accepts
 * the additional USER column emitted by `-axo`.
 */
export function parsePsAxoDarwin(input: string): ParsedPsAxoRow[] {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.slice(1).map((line) => {
    const parts = line.split(/\s+/);
    return {
      pid: Number.parseInt(parts[0] || '0', 10) || 0,
      user: parts[1] || '',
      cpu: Number.parseFloat(parts[2] || '0') || 0,
      mem: Number.parseFloat(parts[3] || '0') || 0,
      command: parts.slice(4).join(' ')
    };
  });
}

export interface ParsedSystemProfilerSPDisplays {
  chipsetModel?: string;
  type?: string;
  bus?: string;
  vendor?: string;
  cores?: number;
  metalSupport?: string;
  displays: Array<{
    name: string;
    resolution?: string;
    main?: boolean;
    online?: boolean;
    connectionType?: string;
  }>;
}

/**
 * Parse `system_profiler SPDisplaysDataType` output (macOS).
 *
 * The format is a hierarchical key:value tree with 2-space indentation.
 * For our purposes we extract the first GPU's metadata and a list of
 * attached displays (each as a sub-stanza two indents deep under
 * "Displays:").
 */
export function parseSystemProfilerSPDisplays(input: string): ParsedSystemProfilerSPDisplays {
  const out: ParsedSystemProfilerSPDisplays = { displays: [] };
  const lines = input.split(/\r?\n/);
  let inDisplaysBlock = false;
  let currentDisplay: ParsedSystemProfilerSPDisplays['displays'][number] | null = null;
  let displayIndent = 0;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    const kv = /^([^:]+?):\s*(.*)$/.exec(trimmed);
    if (!kv) continue;
    const key = kv[1].trim();
    const value = kv[2].trim();
    if (!inDisplaysBlock) {
      if (key === 'Chipset Model') out.chipsetModel = value;
      else if (key === 'Type') out.type = value;
      else if (key === 'Bus') out.bus = value;
      else if (key === 'Vendor') out.vendor = value;
      else if (key === 'Total Number of Cores') out.cores = Number.parseInt(value, 10) || undefined;
      else if (key === 'Metal Support') out.metalSupport = value;
      else if (key === 'Displays' && !value) {
        inDisplaysBlock = true;
        displayIndent = indent;
      }
    } else {
      // Inside Displays block. A line at exactly displayIndent + 2 (one
      // additional level) and ending in a colon with no value starts a
      // new display.
      if (indent === displayIndent + 2 && !value) {
        currentDisplay = { name: key };
        out.displays.push(currentDisplay);
        continue;
      }
      // Lines deeper than that belong to the current display.
      if (currentDisplay && indent > displayIndent + 2) {
        if (key === 'Resolution') currentDisplay.resolution = value;
        else if (key === 'Main Display') currentDisplay.main = /yes/i.test(value);
        else if (key === 'Online') currentDisplay.online = /yes/i.test(value);
        else if (key === 'Connection Type') currentDisplay.connectionType = value;
      }
      // Lines at or shallower than displayIndent end the Displays block.
      if (indent <= displayIndent && value) {
        inDisplaysBlock = false;
        currentDisplay = null;
      }
    }
  }
  return out;
}

export interface ParsedSystemProfilerSPMemory {
  total?: string;
  type?: string;
  manufacturer?: string;
}

/**
 * Parse `system_profiler SPMemoryDataType` output (macOS).
 *
 *   Memory:
 *
 *         Memory: 8 GB
 *         Type: LPDDR5
 *         Manufacturer: Hynix
 *
 * On Apple Silicon the memory is on-package and reports as a single
 * stanza; on Intel Macs the layout includes per-DIMM slots which we
 * intentionally don't enumerate here (memLayout in the domain module
 * already does that path).
 */
export function parseSystemProfilerSPMemory(input: string): ParsedSystemProfilerSPMemory {
  const out: ParsedSystemProfilerSPMemory = {};
  for (const raw of input.split(/\r?\n/)) {
    const trimmed = raw.trim();
    const mem = /^Memory:\s+(\S.+)$/.exec(trimmed);
    if (mem) {
      out.total = mem[1].trim();
      continue;
    }
    const type = /^Type:\s+(\S.+)$/.exec(trimmed);
    if (type) {
      out.type = type[1].trim();
      continue;
    }
    const manuf = /^Manufacturer:\s+(\S.+)$/.exec(trimmed);
    if (manuf) {
      out.manufacturer = manuf[1].trim();
    }
  }
  return out;
}
