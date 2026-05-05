/**
 * Single source of truth for the public function surface generated into
 * `index.generated.ts` by `scripts/codegen-public-api.ts`.
 *
 * Modes:
 *   - `legacy`:    `export const X: Sig = moduleX.X as unknown as Sig;`
 *   - `legacy-direct`: `export const X = moduleX.X;` (no cast — for cases where the source is already typed)
 *   - `modern`:    Three overloads (callback / InspectOptions / InspectEnvelopeOptions) wired through wrapInspectFunction.
 *   - `hybrid`:    Modern overloads PLUS a legacy positional-args overload (rescan, drive, etc.).
 *
 * Hand-written wrappers (NOT in this registry):
 *   - getStaticData / getDynamicData / getAllData — orchestrators with custom logic.
 *   - version, time — synchronous primitives.
 *   - capabilities, capability, schemaVersion, getSchema, diagnostics, etc. — utility re-exports.
 *   - powerShellStart / powerShellRelease — Windows lifecycle helpers.
 */

export type RegistryEntry =
  | LegacyEntry
  | LegacyDirectEntry
  | ModernEntry
  | HybridEntry;

export interface LegacyEntry {
  name: string;
  module: string;
  fn: string;
  mode: 'legacy';
  signature: string; // e.g. "(callback?: Callback<CpuCacheData>) => Promise<CpuCacheData>"
}

export interface LegacyDirectEntry {
  name: string;
  module: string;
  fn: string;
  mode: 'legacy-direct';
  signature: string;
}

export interface ModernEntry {
  name: string;
  module: string;
  fn: string;
  mode: 'modern';
  dataType: string; // e.g. "CpuData" — wraps in InspectEnvelope<...> for the envelope overload
  callForm?: string; // optional override for the inner call expression; default `${module}.${fn}(undefined)`
}

export interface HybridEntry {
  name: string;
  module: string;
  fn: string;
  mode: 'hybrid';
  dataType: string;
  // Verbatim legacy overload + dispatcher body. We keep these hand-written within the entry
  // because each hybrid has a unique positional signature; codegen would obscure rather than help.
  legacyOverload: string;
  dispatcher: string;
}

export const apiRegistry: RegistryEntry[] = [
  // ---- system ----
  { name: 'system', module: 'systemModule', fn: 'system', mode: 'legacy-direct', signature: '(callback?: Callback<SystemData>) => Promise<SystemData>' },
  { name: 'bios', module: 'systemModule', fn: 'bios', mode: 'legacy-direct', signature: '(callback?: Callback<BiosData>) => Promise<BiosData>' },
  { name: 'baseboard', module: 'systemModule', fn: 'baseboard', mode: 'legacy-direct', signature: '(callback?: Callback<BaseboardData>) => Promise<BaseboardData>' },
  { name: 'chassis', module: 'systemModule', fn: 'chassis', mode: 'legacy-direct', signature: '(callback?: Callback<ChassisData>) => Promise<ChassisData>' },

  // ---- osinfo ----
  { name: 'osInfo', module: 'osInfoModule', fn: 'osInfo', mode: 'modern', dataType: 'OsData' },
  { name: 'versions', module: 'osInfoModule', fn: 'versions', mode: 'legacy', signature: '(apps?: string | Callback<VersionData>, callback?: Callback<VersionData>) => Promise<VersionData>' },
  { name: 'shell', module: 'osInfoModule', fn: 'shell', mode: 'legacy', signature: '(callback?: Callback<string>) => Promise<string>' },
  { name: 'uuid', module: 'osInfoModule', fn: 'uuid', mode: 'legacy', signature: '(callback?: Callback<UuidData>) => Promise<UuidData>' },

  // ---- cpu ----
  { name: 'cpu', module: 'cpuModule', fn: 'cpu', mode: 'modern', dataType: 'CpuData' },
  { name: 'cpuFlags', module: 'cpuModule', fn: 'cpuFlags', mode: 'legacy', signature: '(callback?: Callback<string>) => Promise<string>' },
  { name: 'cpuCache', module: 'cpuModule', fn: 'cpuCache', mode: 'legacy', signature: '(callback?: Callback<CpuCacheData>) => Promise<CpuCacheData>' },
  { name: 'cpuCurrentSpeed', module: 'cpuModule', fn: 'cpuCurrentSpeed', mode: 'legacy', signature: '(callback?: Callback<CpuCurrentSpeedData>) => Promise<CpuCurrentSpeedData>' },
  { name: 'cpuTemperature', module: 'cpuModule', fn: 'cpuTemperature', mode: 'legacy', signature: '(callback?: Callback<CpuTemperatureData>) => Promise<CpuTemperatureData>' },
  { name: 'currentLoad', module: 'cpuModule', fn: 'currentLoad', mode: 'legacy', signature: '(callback?: Callback<CurrentLoadData>) => Promise<CurrentLoadData>' },
  { name: 'fullLoad', module: 'cpuModule', fn: 'fullLoad', mode: 'legacy', signature: '(callback?: Callback<number>) => Promise<number>' },

  // ---- memory ----
  { name: 'mem', module: 'memoryModule', fn: 'mem', mode: 'modern', dataType: 'MemData' },
  { name: 'memLayout', module: 'memoryModule', fn: 'memLayout', mode: 'legacy-direct', signature: '(callback?: Callback<MemLayoutData[]>) => Promise<MemLayoutData[]>' },

  // ---- graphics ----
  { name: 'graphics', module: 'graphicsModule', fn: 'graphics', mode: 'modern', dataType: 'MaybeUnsupported<GraphicsData>' },

  // ---- filesystem ----
  // fsSize is hybrid: takes either an inspect-options object OR a `drive` string.
  {
    name: 'fsSize',
    module: 'filesystemModule',
    fn: 'fsSize',
    mode: 'hybrid',
    dataType: 'FsSizeData[]',
    legacyOverload: 'export function fsSize(drive?: string | Callback<FsSizeData[]>, callback?: Callback<FsSizeData[]>): Promise<FsSizeData[]>;',
    dispatcher: `if (typeof optionsOrDrive === 'string') {
    return filesystemModule.fsSize(optionsOrDrive, callback) as Promise<FsSizeData[] | InspectEnvelope<FsSizeData[]>>;
  }
  const normalized = normalizeOptions(optionsOrDrive, callback);
  return withInspectOptions('fsSize', () => filesystemModule.fsSize(undefined, undefined), normalized.options, normalized.callback) as Promise<
    FsSizeData[] | InspectEnvelope<FsSizeData[]>
  >;`
  },
  { name: 'fsOpenFiles', module: 'filesystemModule', fn: 'fsOpenFiles', mode: 'legacy', signature: '(callback?: Callback<FsOpenFilesData>) => Promise<FsOpenFilesData>' },
  { name: 'blockDevices', module: 'filesystemModule', fn: 'blockDevices', mode: 'legacy', signature: '(callback?: Callback<BlockDevicesData[]>) => Promise<BlockDevicesData[]>' },
  { name: 'fsStats', module: 'filesystemModule', fn: 'fsStats', mode: 'legacy', signature: '(callback?: Callback<FsStatsData>) => Promise<FsStatsData>' },
  { name: 'disksIO', module: 'filesystemModule', fn: 'disksIO', mode: 'legacy', signature: '(callback?: Callback<DisksIoData>) => Promise<DisksIoData>' },
  { name: 'diskLayout', module: 'filesystemModule', fn: 'diskLayout', mode: 'modern', dataType: 'DiskLayoutData[]' },

  // ---- network ----
  { name: 'networkInterfaceDefault', module: 'networkModule', fn: 'networkInterfaceDefault', mode: 'legacy', signature: '(callback?: Callback<string>) => Promise<string>' },
  { name: 'networkGatewayDefault', module: 'networkModule', fn: 'networkGatewayDefault', mode: 'legacy', signature: '(callback?: Callback<string>) => Promise<string>' },
  {
    name: 'networkInterfaces',
    module: 'networkModule',
    fn: 'networkInterfaces',
    mode: 'hybrid',
    dataType: 'NetworkInterfacesData[]',
    legacyOverload: 'export function networkInterfaces(callback?: Callback<NetworkInterfacesData[]> | boolean | string, rescan?: boolean, defaultString?: string): Promise<NetworkInterfacesData[]>;',
    dispatcher: `if (typeof optionsOrCallback === 'boolean' || typeof optionsOrCallback === 'string' || (optionsOrCallback && util.isFunction(optionsOrCallback))) {
    return networkModule.networkInterfaces(optionsOrCallback, rescanOrCallback, defaultString) as Promise<
      NetworkInterfacesData[] | InspectEnvelope<NetworkInterfacesData[]>
    >;
  }
  const normalized = normalizeOptions(optionsOrCallback, rescanOrCallback);
  return withInspectOptions('networkInterfaces', () => networkModule.networkInterfaces(undefined, undefined, undefined), normalized.options, normalized.callback) as Promise<
    NetworkInterfacesData[] | InspectEnvelope<NetworkInterfacesData[]>
  >;`
  },
  { name: 'networkStats', module: 'networkModule', fn: 'networkStats', mode: 'legacy', signature: '(ifaces?: string | Callback<NetworkStatsData[]>, callback?: Callback<NetworkStatsData[]>) => Promise<NetworkStatsData[]>' },
  { name: 'networkConnections', module: 'networkModule', fn: 'networkConnections', mode: 'legacy', signature: '(callback?: Callback<NetworkConnectionsData[]>) => Promise<NetworkConnectionsData[]>' },

  // ---- wifi ----
  { name: 'wifiNetworks', module: 'wifiModule', fn: 'wifiNetworks', mode: 'legacy-direct', signature: '(callback?: Callback<MaybeUnsupported<WifiNetworkData[]>>) => Promise<MaybeUnsupported<WifiNetworkData[]>>' },
  { name: 'wifiInterfaces', module: 'wifiModule', fn: 'wifiInterfaces', mode: 'legacy-direct', signature: '(callback?: Callback<WifiInterfaceData[]>) => Promise<WifiInterfaceData[]>' },
  { name: 'wifiConnections', module: 'wifiModule', fn: 'wifiConnections', mode: 'legacy-direct', signature: '(callback?: Callback<WifiConnectionData[]>) => Promise<WifiConnectionData[]>' },

  // ---- processes ----
  { name: 'services', module: 'processesModule', fn: 'services', mode: 'legacy', signature: '(srv?: string | Callback<ServicesData[]>, callback?: Callback<ServicesData[]>) => Promise<ServicesData[]>' },
  { name: 'processes', module: 'processesModule', fn: 'processes', mode: 'modern', dataType: 'ProcessesData' },
  { name: 'processLoad', module: 'processesModule', fn: 'processLoad', mode: 'legacy', signature: '(proc?: string | Callback<ProcessesProcessLoadData[]>, callback?: Callback<ProcessesProcessLoadData[]>) => Promise<ProcessesProcessLoadData[]>' },

  // ---- users ----
  { name: 'users', module: 'usersModule', fn: 'users', mode: 'legacy-direct', signature: '(callback?: Callback<UserData[]>) => Promise<UserData[]>' },

  // ---- internet ----
  { name: 'inetChecksite', module: 'internetModule', fn: 'inetChecksite', mode: 'legacy-direct', signature: '(url: string, callback?: Callback<InetChecksiteData>) => Promise<InetChecksiteData>' },
  { name: 'inetLatency', module: 'internetModule', fn: 'inetLatency', mode: 'legacy-direct', signature: '(host?: string | Callback<number | null>, callback?: Callback<number | null>) => Promise<number | null>' },

  // ---- docker ----
  { name: 'dockerInfo', module: 'dockerModule', fn: 'dockerInfo', mode: 'legacy-direct', signature: '(callback?: Callback<DockerInfoData>) => Promise<DockerInfoData>' },
  { name: 'dockerImages', module: 'dockerModule', fn: 'dockerImages', mode: 'legacy-direct', signature: '(all?: boolean | string | Callback<DockerImageData[]>, callback?: Callback<DockerImageData[]>) => Promise<DockerImageData[]>' },
  { name: 'dockerContainers', module: 'dockerModule', fn: 'dockerContainers', mode: 'legacy-direct', signature: '(all?: boolean | string | Callback<DockerContainerData[]>, callback?: Callback<DockerContainerData[]>) => Promise<DockerContainerData[]>' },
  { name: 'dockerContainerStats', module: 'dockerModule', fn: 'dockerContainerStats', mode: 'legacy-direct', signature: '(containerIDs?: string | Callback<DockerContainerStatsData[]>, callback?: Callback<DockerContainerStatsData[]>) => Promise<DockerContainerStatsData[]>' },
  { name: 'dockerContainerProcesses', module: 'dockerModule', fn: 'dockerContainerProcesses', mode: 'legacy-direct', signature: '(containerID?: string, callback?: Callback<DockerContainerProcessData[]>) => Promise<DockerContainerProcessData[]>' },
  { name: 'dockerVolumes', module: 'dockerModule', fn: 'dockerVolumes', mode: 'legacy-direct', signature: '(callback?: Callback<DockerVolumeData[]>) => Promise<DockerVolumeData[]>' },
  { name: 'dockerAll', module: 'dockerModule', fn: 'dockerAll', mode: 'modern', dataType: 'any[]' },

  // ---- virtualbox ----
  { name: 'vboxInfo', module: 'vboxModule', fn: 'vboxInfo', mode: 'legacy-direct', signature: '(callback?: Callback<VboxInfoData[]>) => Promise<VboxInfoData[]>' },

  // ---- printer / usb / audio / bluetooth ----
  { name: 'printer', module: 'printerModule', fn: 'printer', mode: 'legacy-direct', signature: '(callback?: Callback<MaybeUnsupported<PrinterData[]>>) => Promise<MaybeUnsupported<PrinterData[]>>' },
  { name: 'usb', module: 'usbModule', fn: 'usb', mode: 'legacy-direct', signature: '(callback?: Callback<MaybeUnsupported<UsbData[]>>) => Promise<MaybeUnsupported<UsbData[]>>' },
  { name: 'audio', module: 'audioModule', fn: 'audio', mode: 'legacy-direct', signature: '(callback?: Callback<MaybeUnsupported<AudioData[]>>) => Promise<MaybeUnsupported<AudioData[]>>' },
  { name: 'bluetoothDevices', module: 'bluetoothModule', fn: 'bluetoothDevices', mode: 'legacy-direct', signature: '(callback?: Callback<MaybeUnsupported<BluetoothDeviceData[]>>) => Promise<MaybeUnsupported<BluetoothDeviceData[]>>' }
];
