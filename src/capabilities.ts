import * as fs from 'fs';
import * as util from './util';
import type { CapabilityRecord, Confidence, InspectOptions, PublicFunctionName } from './types';

type Support = true | false | 'partial';

interface CapabilityDefinition {
  name: PublicFunctionName;
  platforms?: NodeJS.Platform[];
  tools?: string[];
  permissionsRequired?: boolean;
  confidence?: Confidence;
  notes?: string;
  support?: Support;
}

const platform = process.platform;
const unixTools = platform === 'win32' ? [] : ['sh'];

const definitions: CapabilityDefinition[] = [
  { name: 'system', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['ioreg', 'system_profiler'] : ['dmidecode'], permissionsRequired: platform !== 'darwin' && platform !== 'win32', support: 'partial' },
  { name: 'bios', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['dmidecode'], permissionsRequired: platform !== 'darwin' && platform !== 'win32', support: 'partial' },
  { name: 'baseboard', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['dmidecode'], permissionsRequired: platform !== 'darwin' && platform !== 'win32', support: 'partial' },
  { name: 'chassis', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['ioreg'] : ['dmidecode'], permissionsRequired: platform !== 'darwin' && platform !== 'win32', support: 'partial' },
  { name: 'osInfo', support: true },
  { name: 'versions', tools: ['node'], support: true },
  { name: 'shell', support: true },
  { name: 'uuid', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : [], support: true },
  { name: 'cpu', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['sysctl'] : ['lscpu'], support: true },
  { name: 'cpuFlags', tools: platform === 'win32' ? ['reg'] : platform === 'darwin' ? ['sysctl'] : ['lscpu'], support: true },
  { name: 'cpuCache', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['sysctl'] : ['lscpu'], support: 'partial' },
  { name: 'cpuCurrentSpeed', support: true },
  { name: 'cpuTemperature', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? [] : ['sensors'], support: 'partial', notes: 'Temperature depends on hardware sensors and OS permissions.' },
  { name: 'currentLoad', support: true },
  { name: 'fullLoad', support: true },
  { name: 'mem', support: true },
  { name: 'memLayout', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['dmidecode'], permissionsRequired: platform !== 'darwin' && platform !== 'win32', support: 'partial' },
  { name: 'battery', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['ioreg'] : [], support: 'partial' },
  { name: 'graphics', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['lspci'], support: 'partial' },
  { name: 'fsSize', tools: platform === 'win32' ? ['powershell'] : ['df'], support: true },
  { name: 'fsOpenFiles', platforms: ['linux', 'darwin', 'freebsd', 'openbsd', 'netbsd', 'sunos'] as NodeJS.Platform[], support: 'partial' },
  { name: 'blockDevices', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['diskutil'] : ['lsblk'], support: 'partial' },
  { name: 'fsStats', platforms: ['linux', 'darwin'] as NodeJS.Platform[], support: 'partial' },
  { name: 'disksIO', platforms: ['linux', 'darwin', 'freebsd', 'openbsd', 'netbsd'] as NodeJS.Platform[], support: 'partial' },
  { name: 'diskLayout', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['lsblk'], support: 'partial' },
  { name: 'networkInterfaceDefault', support: true },
  { name: 'networkGatewayDefault', tools: platform === 'win32' ? ['route'] : ['netstat'], support: 'partial' },
  { name: 'networkInterfaces', support: true },
  { name: 'networkStats', support: true },
  { name: 'networkConnections', tools: platform === 'win32' ? ['netstat'] : ['netstat'], support: 'partial' },
  { name: 'wifiNetworks', tools: platform === 'win32' ? ['netsh'] : platform === 'darwin' ? ['airport'] : ['nmcli', 'iwlist'], support: 'partial' },
  { name: 'wifiInterfaces', tools: platform === 'win32' ? ['netsh'] : platform === 'darwin' ? ['networksetup'] : ['iw'], support: 'partial' },
  { name: 'wifiConnections', tools: platform === 'win32' ? ['netsh'] : platform === 'darwin' ? ['airport'] : ['nmcli'], support: 'partial' },
  { name: 'services', tools: platform === 'win32' ? ['powershell'] : ['ps'], support: 'partial' },
  { name: 'processes', tools: platform === 'win32' ? ['powershell'] : ['ps'], support: true },
  { name: 'processLoad', tools: platform === 'win32' ? ['powershell'] : ['ps'], support: true },
  { name: 'users', tools: platform === 'win32' ? ['powershell'] : ['who', 'w'], support: 'partial' },
  { name: 'inetChecksite', support: true },
  { name: 'inetLatency', tools: ['ping'], support: 'partial' },
  { name: 'dockerInfo', tools: ['docker'], support: 'partial', permissionsRequired: platform !== 'win32', notes: 'Uses the Docker socket when available.' },
  { name: 'dockerImages', tools: ['docker'], support: 'partial', permissionsRequired: platform !== 'win32' },
  { name: 'dockerContainers', tools: ['docker'], support: 'partial', permissionsRequired: platform !== 'win32' },
  { name: 'dockerContainerStats', tools: ['docker'], support: 'partial', permissionsRequired: platform !== 'win32' },
  { name: 'dockerContainerProcesses', tools: ['docker'], support: 'partial', permissionsRequired: platform !== 'win32' },
  { name: 'dockerVolumes', tools: ['docker'], support: 'partial', permissionsRequired: platform !== 'win32' },
  { name: 'dockerAll', tools: ['docker'], support: 'partial', permissionsRequired: platform !== 'win32' },
  { name: 'vboxInfo', tools: ['vboxmanage'], support: 'partial' },
  { name: 'printer', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['lpstat'] : ['lpstat'], support: 'partial' },
  { name: 'usb', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['lsusb'], support: 'partial' },
  { name: 'audio', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['lspci'], support: 'partial' },
  { name: 'bluetoothDevices', tools: platform === 'win32' ? ['powershell'] : platform === 'darwin' ? ['system_profiler'] : ['hcitool'], support: 'partial' },
  { name: 'getStaticData', support: true },
  { name: 'getDynamicData', support: true },
  { name: 'getAllData', support: true },
  { name: 'version', support: true },
  { name: 'time', support: true }
];

function normalizeTool(tool: string): string {
  return tool === 'powershell' && platform === 'win32' ? 'powershell.exe' : tool;
}

async function toolAvailable(tool: string, options?: InspectOptions): Promise<boolean> {
  const normalized = normalizeTool(tool);
  if (normalized === 'airport' && platform === 'darwin') {
    return fs.existsSync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport');
  }
  const timeout = options?.timeoutMs && options.timeoutMs > 0 ? Math.min(options.timeoutMs, 3000) : 1000;
  const stdout =
    platform === 'win32'
      ? await util.execSafe('where', [normalized], { timeout, feature: 'capabilities' })
      : await util.execSafe(unixTools[0] || 'sh', ['-c', `command -v ${util.sanitizeShellString(normalized, true)}`], { timeout, feature: 'capabilities' });
  return Boolean(stdout.trim());
}

export async function capabilities(options?: InspectOptions): Promise<CapabilityRecord[]> {
  const allTools = Array.from(new Set(definitions.flatMap((definition) => definition.tools || [])));
  const availability = new Map<string, boolean>();
  await Promise.all(
    allTools.map(async (tool) => {
      availability.set(tool, await toolAvailable(tool, options));
    })
  );

  return definitions.map((definition) => {
    const requiredTools = definition.tools || [];
    const availableTools = requiredTools.filter((tool) => availability.get(tool));
    const platformSupported = !definition.platforms || definition.platforms.includes(platform);
    const support = definition.support ?? true;
    const supported = platformSupported && support !== false && (requiredTools.length === 0 || availableTools.length > 0);
    return {
      function: definition.name,
      supported,
      platform,
      requiredTools,
      availableTools,
      permissionsRequired: Boolean(definition.permissionsRequired),
      confidence: definition.confidence || (supported && (support === true || requiredTools.length === availableTools.length) ? 'high' : 'medium'),
      notes: definition.notes
    };
  });
}

export async function capability(name: PublicFunctionName, options?: InspectOptions): Promise<CapabilityRecord> {
  const records = await capabilities(options);
  return (
    records.find((record) => record.function === name) || {
      function: name,
      supported: false,
      platform,
      requiredTools: [],
      availableTools: [],
      permissionsRequired: false,
      confidence: 'low',
      notes: 'No capability metadata is registered for this function.'
    }
  );
}
