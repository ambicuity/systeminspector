'use strict';
// ==================================================================================
// index.ts
// ----------------------------------------------------------------------------------
// Description:   System Inspector - library
//                for Node.js
// Copyright:     (c) 2026 Project Contributors
// Maintainers:   Project Contributors
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================

import { version as libVersion } from '../package.json';
import * as util from './util';
export * from './types';
import * as capabilityModule from './capabilities';
import { redactData } from './redaction';
import * as schemaModule from './schema';
import * as systemModule from './system';
import * as osInfoModule from './osinfo';
import * as cpuModule from './cpu';
import * as memoryModule from './memory';
import batteryModule from './battery';
import * as graphicsModule from './graphics';
import * as filesystemModule from './filesystem';
import * as networkModule from './network';
import * as wifiModule from './wifi';
import * as processesModule from './processes';
import * as usersModule from './users';
import * as internetModule from './internet';
import * as dockerModule from './docker';
import * as vboxModule from './virtualbox';
import * as printerModule from './printer';
import * as usbModule from './usb';
import * as audioModule from './audio';
import * as bluetoothModule from './bluetooth';
import type {
  AllData,
  AudioData,
  BaseboardData,
  BatteryData,
  BiosData,
  BluetoothDeviceData,
  BlockDevicesData,
  Callback,
  ChassisData,
  CpuCacheData,
  CpuCurrentSpeedData,
  CpuData,
  CpuTemperatureData,
  CurrentLoadData,
  DisksIoData,
  DiskLayoutData,
  DiagnosticData,
  DockerContainerData,
  DockerContainerProcessData,
  DockerContainerStatsData,
  DockerImageData,
  DockerInfoData,
  DockerVolumeData,
  DynamicData,
  FsOpenFilesData,
  FsSizeData,
  FsStatsData,
  GetValueObject,
  GetResult,
  GraphicsData,
  InetChecksiteData,
  InspectEnvelope,
  InspectEnvelopeOptions,
  InspectOptions,
  JsonSchema,
  MaybeUnsupported,
  MemData,
  MemLayoutData,
  NetworkConnectionsData,
  NetworkInterfacesData,
  NetworkStatsData,
  ObserveHandle,
  OsData,
  PrinterData,
  ProcessesData,
  ProcessesProcessLoadData,
  PublicFunctionName,
  SelectorBuilder,
  ServicesData,
  StaticData,
  SystemData,
  TimeData,
  UsbData,
  UserData,
  UuidData,
  VboxInfoData,
  VersionData,
  WifiConnectionData,
  WifiInterfaceData,
  WifiNetworkData,
  CapabilityRecord,
  DiagnosticsOptions,
  DiagnosticRecord,
  WatchOptions
} from './types';

const _platform = process.platform;
const _windows = _platform === 'win32';
const _freebsd = _platform === 'freebsd';
const _openbsd = _platform === 'openbsd';
const _netbsd = _platform === 'netbsd';
const _sunos = _platform === 'sunos';

type PublicApi = Record<string, any>;
type OptionsCallback<T> = Callback<T> | InspectOptions | InspectEnvelopeOptions | undefined;

if (_windows) {
  util.getCodepage();
  util.getPowershell();
}

export function version(): string {
  return libVersion;
}

export const diagnostics: (options?: DiagnosticsOptions) => DiagnosticData[] = util.diagnostics as (options?: DiagnosticsOptions) => DiagnosticData[];
export const clearDiagnostics: () => void = util.clearDiagnostics;
export const onDiagnostic: (listener: (record: DiagnosticRecord) => void) => () => void = util.onDiagnostic;
export const schemaVersion: () => string = schemaModule.schemaVersion;
export const getSchema: (name?: string) => JsonSchema = schemaModule.getSchema;
export const capabilities: (options?: InspectOptions) => Promise<CapabilityRecord[]> = capabilityModule.capabilities;
export const capability: (name: PublicFunctionName, options?: InspectOptions) => Promise<CapabilityRecord> = capabilityModule.capability;

export const system: (callback?: Callback<SystemData>) => Promise<SystemData> = systemModule.system;
export const bios: (callback?: Callback<BiosData>) => Promise<BiosData> = systemModule.bios;
export const baseboard: (callback?: Callback<BaseboardData>) => Promise<BaseboardData> = systemModule.baseboard;
export const chassis: (callback?: Callback<ChassisData>) => Promise<ChassisData> = systemModule.chassis;

export const time: () => TimeData = osInfoModule.time;
export function osInfo(callback?: Callback<OsData>): Promise<OsData>;
export function osInfo(options?: InspectOptions, callback?: Callback<OsData>): Promise<OsData>;
export function osInfo(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<OsData>>): Promise<InspectEnvelope<OsData>>;
export function osInfo(options?: any, callback?: any): Promise<OsData | InspectEnvelope<OsData>> {
  return wrapInspectFunction<OsData>('osInfo', () => osInfoModule.osInfo(undefined), options, callback);
}
export const versions: (apps?: string | Callback<VersionData>, callback?: Callback<VersionData>) => Promise<VersionData> = osInfoModule.versions as unknown as (apps?: string | Callback<VersionData>, callback?: Callback<VersionData>) => Promise<VersionData>;
export const shell: (callback?: Callback<string>) => Promise<string> = osInfoModule.shell as unknown as (callback?: Callback<string>) => Promise<string>;
export const uuid: (callback?: Callback<UuidData>) => Promise<UuidData> = osInfoModule.uuid as unknown as (callback?: Callback<UuidData>) => Promise<UuidData>;

function normalizeOptions<T>(options?: OptionsCallback<T>, callback?: Callback<T>): { options: InspectOptions | InspectEnvelopeOptions; callback?: Callback<T> } {
  if (util.isFunction(options)) {
    return { options: {}, callback: options as Callback<T> };
  }
  return { options: (options || {}) as InspectOptions | InspectEnvelopeOptions, callback };
}

async function withInspectOptions<T>(
  functionName: PublicFunctionName,
  task: () => Promise<T>,
  options?: InspectOptions | InspectEnvelopeOptions,
  callback?: Callback<T | InspectEnvelope<T>>
): Promise<T | InspectEnvelope<T>> {
  options = util.applyInspectPolicy((options || {}) as InspectOptions) as InspectOptions | InspectEnvelopeOptions;
  const started = Date.now();
  const beforeDiagnostics = diagnostics().length;
  let data = await util.withTimeout(functionName, task(), options?.timeoutMs || 0, options?.signal);
  data = redactData(data, options?.redact);
  if ((options as InspectEnvelopeOptions | undefined)?.envelope) {
    const envelope: InspectEnvelope<T> = {
      schemaVersion: schemaVersion(),
      data,
      diagnostics: diagnostics().slice(beforeDiagnostics) as DiagnosticRecord[],
      durationMs: Date.now() - started,
      source: functionName,
      platform: process.platform,
      confidence: 'high'
    };
    callback?.(envelope);
    return envelope;
  }
  callback?.(data);
  return data;
}

function createSelector(): SelectorBuilder {
  const state: { fields: string[]; filter?: string } = { fields: [] };
  return {
    fields(...names: string[]) {
      state.fields.push(...names.filter(Boolean));
      return this;
    },
    filter(name: string, value: string | number) {
      state.filter = `${name}:${value}`;
      return this;
    },
    all() {
      state.fields = ['*'];
      return this;
    },
    toString() {
      const base = state.fields.length ? state.fields.join(',') : '*';
      return state.filter ? `${base}|${state.filter}` : base;
    }
  };
}

function wrapInspectFunction<T>(functionName: PublicFunctionName, task: () => Promise<any>, options?: any, callback?: any): Promise<T | InspectEnvelope<T>> {
  const normalized = normalizeOptions<T>(options, callback);
  return withInspectOptions(functionName, task, normalized.options, normalized.callback as Callback<T | InspectEnvelope<T>> | undefined) as Promise<
    T | InspectEnvelope<T>
  >;
}

export function cpu(callback?: Callback<CpuData>): Promise<CpuData>;
export function cpu(options?: InspectOptions, callback?: Callback<CpuData>): Promise<CpuData>;
export function cpu(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<CpuData>>): Promise<InspectEnvelope<CpuData>>;
export function cpu(options?: any, callback?: any): Promise<CpuData | InspectEnvelope<CpuData>> {
  return wrapInspectFunction<CpuData>('cpu', () => cpuModule.cpu(undefined), options, callback);
}
export const cpuFlags: (callback?: Callback<string>) => Promise<string> = cpuModule.cpuFlags as unknown as (callback?: Callback<string>) => Promise<string>;
export const cpuCache: (callback?: Callback<CpuCacheData>) => Promise<CpuCacheData> = cpuModule.cpuCache as unknown as (callback?: Callback<CpuCacheData>) => Promise<CpuCacheData>;
export const cpuCurrentSpeed: (callback?: Callback<CpuCurrentSpeedData>) => Promise<CpuCurrentSpeedData> = cpuModule.cpuCurrentSpeed as unknown as (callback?: Callback<CpuCurrentSpeedData>) => Promise<CpuCurrentSpeedData>;
export const cpuTemperature: (callback?: Callback<CpuTemperatureData>) => Promise<CpuTemperatureData> = cpuModule.cpuTemperature as unknown as (callback?: Callback<CpuTemperatureData>) => Promise<CpuTemperatureData>;
export const currentLoad: (callback?: Callback<CurrentLoadData>) => Promise<CurrentLoadData> = cpuModule.currentLoad as unknown as (callback?: Callback<CurrentLoadData>) => Promise<CurrentLoadData>;
export const fullLoad: (callback?: Callback<number>) => Promise<number> = cpuModule.fullLoad as unknown as (callback?: Callback<number>) => Promise<number>;

export function mem(callback?: Callback<MemData>): Promise<MemData>;
export function mem(options?: InspectOptions, callback?: Callback<MemData>): Promise<MemData>;
export function mem(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<MemData>>): Promise<InspectEnvelope<MemData>>;
export function mem(options?: any, callback?: any): Promise<MemData | InspectEnvelope<MemData>> {
  return wrapInspectFunction<MemData>('mem', () => memoryModule.mem(undefined), options, callback);
}
export const memLayout: (callback?: Callback<MemLayoutData[]>) => Promise<MemLayoutData[]> = memoryModule.memLayout;

export const battery: (callback?: Callback<BatteryData>) => Promise<BatteryData> = batteryModule;
export function graphics(callback?: Callback<MaybeUnsupported<GraphicsData>>): Promise<MaybeUnsupported<GraphicsData>>;
export function graphics(options?: InspectOptions, callback?: Callback<MaybeUnsupported<GraphicsData>>): Promise<MaybeUnsupported<GraphicsData>>;
export function graphics(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<MaybeUnsupported<GraphicsData>>>): Promise<InspectEnvelope<MaybeUnsupported<GraphicsData>>>;
export function graphics(options?: any, callback?: any): Promise<MaybeUnsupported<GraphicsData> | InspectEnvelope<MaybeUnsupported<GraphicsData>>> {
  return wrapInspectFunction<MaybeUnsupported<GraphicsData>>('graphics', () => graphicsModule.graphics(undefined), options, callback);
}

export function fsSize(callback?: Callback<FsSizeData[]>): Promise<FsSizeData[]>;
export function fsSize(options?: InspectOptions, callback?: Callback<FsSizeData[]>): Promise<FsSizeData[]>;
export function fsSize(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<FsSizeData[]>>): Promise<InspectEnvelope<FsSizeData[]>>;
export function fsSize(drive?: string | Callback<FsSizeData[]>, callback?: Callback<FsSizeData[]>): Promise<FsSizeData[]>;
export function fsSize(optionsOrDrive?: any, callback?: any): Promise<FsSizeData[] | InspectEnvelope<FsSizeData[]>> {
  if (typeof optionsOrDrive === 'string') {
    return filesystemModule.fsSize(optionsOrDrive, callback) as Promise<FsSizeData[] | InspectEnvelope<FsSizeData[]>>;
  }
  const normalized = normalizeOptions(optionsOrDrive, callback);
  return withInspectOptions('fsSize', () => filesystemModule.fsSize(undefined, undefined), normalized.options, normalized.callback) as Promise<
    FsSizeData[] | InspectEnvelope<FsSizeData[]>
  >;
}
export const fsOpenFiles: (callback?: Callback<FsOpenFilesData>) => Promise<FsOpenFilesData> = filesystemModule.fsOpenFiles as unknown as (callback?: Callback<FsOpenFilesData>) => Promise<FsOpenFilesData>;
export const blockDevices: (callback?: Callback<BlockDevicesData[]>) => Promise<BlockDevicesData[]> = filesystemModule.blockDevices as unknown as (callback?: Callback<BlockDevicesData[]>) => Promise<BlockDevicesData[]>;
export const fsStats: (callback?: Callback<FsStatsData>) => Promise<FsStatsData> = filesystemModule.fsStats as unknown as (callback?: Callback<FsStatsData>) => Promise<FsStatsData>;
export const disksIO: (callback?: Callback<DisksIoData>) => Promise<DisksIoData> = filesystemModule.disksIO as unknown as (callback?: Callback<DisksIoData>) => Promise<DisksIoData>;
export function diskLayout(callback?: Callback<DiskLayoutData[]>): Promise<DiskLayoutData[]>;
export function diskLayout(options?: InspectOptions, callback?: Callback<DiskLayoutData[]>): Promise<DiskLayoutData[]>;
export function diskLayout(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<DiskLayoutData[]>>): Promise<InspectEnvelope<DiskLayoutData[]>>;
export function diskLayout(options?: any, callback?: any): Promise<DiskLayoutData[] | InspectEnvelope<DiskLayoutData[]>> {
  return wrapInspectFunction<DiskLayoutData[]>('diskLayout', () => filesystemModule.diskLayout(undefined), options, callback);
}

export const networkInterfaceDefault: (callback?: Callback<string>) => Promise<string> = networkModule.networkInterfaceDefault as unknown as (callback?: Callback<string>) => Promise<string>;
export const networkGatewayDefault: (callback?: Callback<string>) => Promise<string> = networkModule.networkGatewayDefault as unknown as (callback?: Callback<string>) => Promise<string>;
export function networkInterfaces(callback?: Callback<NetworkInterfacesData[]> | boolean | string, rescan?: boolean, defaultString?: string): Promise<NetworkInterfacesData[]>;
export function networkInterfaces(options?: InspectOptions, callback?: Callback<NetworkInterfacesData[]>): Promise<NetworkInterfacesData[]>;
export function networkInterfaces(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<NetworkInterfacesData[]>>): Promise<InspectEnvelope<NetworkInterfacesData[]>>;
export function networkInterfaces(optionsOrCallback?: any, rescanOrCallback?: any, defaultString?: string): Promise<NetworkInterfacesData[] | InspectEnvelope<NetworkInterfacesData[]>> {
  if (typeof optionsOrCallback === 'boolean' || typeof optionsOrCallback === 'string' || (optionsOrCallback && util.isFunction(optionsOrCallback))) {
    return networkModule.networkInterfaces(optionsOrCallback, rescanOrCallback, defaultString) as Promise<
      NetworkInterfacesData[] | InspectEnvelope<NetworkInterfacesData[]>
    >;
  }
  const normalized = normalizeOptions(optionsOrCallback, rescanOrCallback);
  return withInspectOptions('networkInterfaces', () => networkModule.networkInterfaces(undefined, undefined, undefined), normalized.options, normalized.callback) as Promise<
    NetworkInterfacesData[] | InspectEnvelope<NetworkInterfacesData[]>
  >;
}
export const networkStats: (ifaces?: string | Callback<NetworkStatsData[]>, callback?: Callback<NetworkStatsData[]>) => Promise<NetworkStatsData[]> = networkModule.networkStats as unknown as (ifaces?: string | Callback<NetworkStatsData[]>, callback?: Callback<NetworkStatsData[]>) => Promise<NetworkStatsData[]>;
export const networkConnections: (callback?: Callback<NetworkConnectionsData[]>) => Promise<NetworkConnectionsData[]> = networkModule.networkConnections as unknown as (callback?: Callback<NetworkConnectionsData[]>) => Promise<NetworkConnectionsData[]>;

export const wifiNetworks: (callback?: Callback<MaybeUnsupported<WifiNetworkData[]>>) => Promise<MaybeUnsupported<WifiNetworkData[]>> = wifiModule.wifiNetworks;
export const wifiInterfaces: (callback?: Callback<WifiInterfaceData[]>) => Promise<WifiInterfaceData[]> = wifiModule.wifiInterfaces;
export const wifiConnections: (callback?: Callback<WifiConnectionData[]>) => Promise<WifiConnectionData[]> = wifiModule.wifiConnections;

export const services: (srv?: string | Callback<ServicesData[]>, callback?: Callback<ServicesData[]>) => Promise<ServicesData[]> = processesModule.services as unknown as (srv?: string | Callback<ServicesData[]>, callback?: Callback<ServicesData[]>) => Promise<ServicesData[]>;
export function processes(callback?: Callback<ProcessesData>): Promise<ProcessesData>;
export function processes(options?: InspectOptions, callback?: Callback<ProcessesData>): Promise<ProcessesData>;
export function processes(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<ProcessesData>>): Promise<InspectEnvelope<ProcessesData>>;
export function processes(options?: any, callback?: any): Promise<ProcessesData | InspectEnvelope<ProcessesData>> {
  return wrapInspectFunction<ProcessesData>('processes', () => processesModule.processes(undefined), options, callback);
}
export const processLoad: (proc?: string | Callback<ProcessesProcessLoadData[]>, callback?: Callback<ProcessesProcessLoadData[]>) => Promise<ProcessesProcessLoadData[]> = processesModule.processLoad as unknown as (proc?: string | Callback<ProcessesProcessLoadData[]>, callback?: Callback<ProcessesProcessLoadData[]>) => Promise<ProcessesProcessLoadData[]>;

export const users: (callback?: Callback<UserData[]>) => Promise<UserData[]> = usersModule.users;

export const inetChecksite: (url: string, callback?: Callback<InetChecksiteData>) => Promise<InetChecksiteData> = internetModule.inetChecksite;
export const inetLatency: (host?: string | Callback<number | null>, callback?: Callback<number | null>) => Promise<number | null> = internetModule.inetLatency;

export const dockerInfo: (callback?: Callback<DockerInfoData>) => Promise<DockerInfoData> = dockerModule.dockerInfo;
export const dockerImages: (all?: boolean | string | Callback<DockerImageData[]>, callback?: Callback<DockerImageData[]>) => Promise<DockerImageData[]> = dockerModule.dockerImages;
export const dockerContainers: (
  all?: boolean | string | Callback<DockerContainerData[]>,
  callback?: Callback<DockerContainerData[]>
) => Promise<DockerContainerData[]> = dockerModule.dockerContainers;
export const dockerContainerStats: (
  containerIDs?: string | Callback<DockerContainerStatsData[]>,
  callback?: Callback<DockerContainerStatsData[]>
) => Promise<DockerContainerStatsData[]> = dockerModule.dockerContainerStats;
export const dockerContainerProcesses: (containerID?: string, callback?: Callback<DockerContainerProcessData[]>) => Promise<DockerContainerProcessData[]> = dockerModule.dockerContainerProcesses;
export const dockerVolumes: (callback?: Callback<DockerVolumeData[]>) => Promise<DockerVolumeData[]> = dockerModule.dockerVolumes;
export function dockerAll(callback?: Callback<any[]>): Promise<any[]>;
export function dockerAll(options?: InspectOptions, callback?: Callback<any[]>): Promise<any[]>;
export function dockerAll(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<any[]>>): Promise<InspectEnvelope<any[]>>;
export function dockerAll(options?: any, callback?: any): Promise<any[] | InspectEnvelope<any[]>> {
  return wrapInspectFunction<any[]>('dockerAll', () => dockerModule.dockerAll(undefined), options, callback);
}

export const vboxInfo: (callback?: Callback<VboxInfoData[]>) => Promise<VboxInfoData[]> = vboxModule.vboxInfo;
export const printer: (callback?: Callback<MaybeUnsupported<PrinterData[]>>) => Promise<MaybeUnsupported<PrinterData[]>> = printerModule.printer;
export const usb: (callback?: Callback<MaybeUnsupported<UsbData[]>>) => Promise<MaybeUnsupported<UsbData[]>> = usbModule.usb;
export const audio: (callback?: Callback<MaybeUnsupported<AudioData[]>>) => Promise<MaybeUnsupported<AudioData[]>> = audioModule.audio;
export const bluetoothDevices: (callback?: Callback<MaybeUnsupported<BluetoothDeviceData[]>>) => Promise<MaybeUnsupported<BluetoothDeviceData[]>> = bluetoothModule.bluetoothDevices;

export const powerShellStart: () => void = util.powerShellStart;
export const powerShellRelease: () => void = util.powerShellRelease;

function getPublicApi(): PublicApi {
  return {
    version,
    diagnostics,
    clearDiagnostics,
    onDiagnostic,
    capabilities,
    capability,
    schemaVersion,
    getSchema,
    system,
    bios,
    baseboard,
    chassis,
    time,
    osInfo,
    versions,
    shell,
    uuid,
    cpu,
    cpuFlags,
    cpuCache,
    cpuCurrentSpeed,
    cpuTemperature,
    currentLoad,
    fullLoad,
    mem,
    memLayout,
    battery,
    graphics,
    fsSize,
    fsOpenFiles,
    blockDevices,
    fsStats,
    disksIO,
    diskLayout,
    networkInterfaceDefault,
    networkGatewayDefault,
    networkInterfaces,
    networkStats,
    networkConnections,
    wifiNetworks,
    wifiInterfaces,
    wifiConnections,
    services,
    processes,
    processLoad,
    users,
    inetChecksite,
    inetLatency,
    dockerInfo,
    dockerImages,
    dockerContainers,
    dockerContainerStats,
    dockerContainerProcesses,
    dockerVolumes,
    dockerAll,
    vboxInfo,
    printer,
    usb,
    audio,
    bluetoothDevices,
    getStaticData,
    getDynamicData,
    getAllData
  };
}

export function getStaticData(callback?: Callback<StaticData>): Promise<StaticData>;
export function getStaticData(options?: InspectOptions, callback?: Callback<StaticData>): Promise<StaticData>;
export function getStaticData(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<StaticData>>): Promise<InspectEnvelope<StaticData>>;
export function getStaticData(options?: any, callback?: any): Promise<StaticData | InspectEnvelope<StaticData>> {
  const normalized = normalizeOptions(options, callback);
  return new Promise((resolve) => {
    process.nextTick(() => {
      Promise.all([
        system(),
        bios(),
        baseboard(),
        chassis(),
        osInfo(),
        uuid(),
        versions(),
        cpu(),
        cpuFlags(),
        graphics(),
        networkInterfaces(),
        memLayout(),
        diskLayout(),
        audio(),
        bluetoothDevices(),
        usb(),
        printer()
      ]).then((res) => {
        const cpuData = res[7] as CpuData;
        cpuData.flags = res[8] as string;
        const data: StaticData = {
          version: version(),
          system: res[0] as SystemData,
          bios: res[1] as BiosData,
          baseboard: res[2] as BaseboardData,
          chassis: res[3] as ChassisData,
          os: res[4] as OsData,
          uuid: res[5] as UuidData,
          versions: res[6] as VersionData,
          cpu: cpuData,
          graphics: res[9] as MaybeUnsupported<GraphicsData>,
          net: res[10] as NetworkInterfacesData[],
          memLayout: res[11] as MemLayoutData[],
          diskLayout: res[12] as never,
          audio: res[13] as MaybeUnsupported<AudioData[]>,
          bluetooth: res[14] as MaybeUnsupported<BluetoothDeviceData[]>,
          usb: res[15] as MaybeUnsupported<UsbData[]>,
          printer: res[16] as MaybeUnsupported<PrinterData[]>
        };
        withInspectOptions('getStaticData', () => Promise.resolve(data), normalized.options, normalized.callback).then((result) =>
          resolve(result as StaticData | InspectEnvelope<StaticData>)
        );
      });
    });
  });
}

export function getDynamicData(callback?: Callback<Partial<DynamicData>>): Promise<Partial<DynamicData>>;
export function getDynamicData(options?: InspectOptions, callback?: Callback<Partial<DynamicData>>): Promise<Partial<DynamicData>>;
export function getDynamicData(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<Partial<DynamicData>>>): Promise<InspectEnvelope<Partial<DynamicData>>>;
export function getDynamicData(srv?: string, callback?: Callback<Partial<DynamicData>>): Promise<Partial<DynamicData>>;
export function getDynamicData(srv?: string, iface?: string, callback?: Callback<Partial<DynamicData>>): Promise<Partial<DynamicData>>;
export function getDynamicData(
  srv?: any,
  iface?: any,
  callback?: any
): Promise<Partial<DynamicData> | InspectEnvelope<Partial<DynamicData>>> {
  let inspectOptions: InspectOptions | InspectEnvelopeOptions = {};
  if (srv && typeof srv === 'object') {
    inspectOptions = srv as InspectOptions | InspectEnvelopeOptions;
    srv = '';
  }
  if (util.isFunction(iface)) {
    callback = iface as Callback<Partial<DynamicData>>;
    iface = '';
  }
  if (util.isFunction(srv)) {
    callback = srv as Callback<Partial<DynamicData>>;
    srv = '';
  }

  return new Promise((resolve) => {
    process.nextTick(() => {
      const ifaceName = (iface as string) || (networkModule as { getDefaultNetworkInterface: () => string }).getDefaultNetworkInterface();
      const serviceNames = (srv as string) || '';
      const data: Partial<DynamicData> = {
        time: time(),
        node: process.versions.node,
        v8: process.versions.v8
      };

      const workload: Promise<void>[] = [
        cpuCurrentSpeed().then((res) => {
          data.cpuCurrentSpeed = res;
        }),
        users().then((res) => {
          data.users = res;
        }),
        processes().then((res) => {
          data.processes = res;
        }),
        currentLoad().then((res) => {
          data.currentLoad = res;
        }),
        mem().then((res) => {
          data.mem = res;
        }),
        inetLatency().then((res) => {
          data.inetLatency = res;
        })
      ];

      if (!_sunos) {
        workload.push(
          cpuTemperature().then((res) => {
            data.temp = res;
          }),
          networkConnections().then((res) => {
            data.networkConnections = res;
          }),
          battery().then((res) => {
            data.battery = res;
          }),
          services(serviceNames).then((res) => {
            data.services = res;
          }),
          fsSize().then((res) => {
            data.fsSize = res;
          })
        );
      }

      if (!_openbsd && !_freebsd && !_netbsd && !_sunos) {
        workload.push(
          networkStats(ifaceName).then((res) => {
            data.networkStats = res;
          }),
          wifiNetworks().then((res) => {
            data.wifiNetworks = res;
          })
        );
      }

      if (!_windows && !_openbsd && !_freebsd && !_netbsd && !_sunos) {
        workload.push(
          fsStats().then((res) => {
            data.fsStats = res;
          }),
          disksIO().then((res) => {
            data.disksIO = res;
          })
        );
      }

      Promise.all(workload).then(() => {
        withInspectOptions('getDynamicData', () => Promise.resolve(data), inspectOptions, callback as Callback<Partial<DynamicData> | InspectEnvelope<Partial<DynamicData>>>).then(
          (result) => resolve(result as Partial<DynamicData>)
        );
      });
    });
  });
}

export function getAllData(callback?: Callback<AllData>): Promise<AllData>;
export function getAllData(options?: InspectOptions, callback?: Callback<AllData>): Promise<AllData>;
export function getAllData(options: InspectEnvelopeOptions, callback?: Callback<InspectEnvelope<AllData>>): Promise<InspectEnvelope<AllData>>;
export function getAllData(srv?: string, callback?: Callback<AllData>): Promise<AllData>;
export function getAllData(srv?: string, iface?: string, callback?: Callback<AllData>): Promise<AllData>;
export function getAllData(
  srv?: any,
  iface?: any,
  callback?: any
): Promise<AllData | InspectEnvelope<AllData>> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      let options: InspectOptions | InspectEnvelopeOptions = {};
      if (srv && typeof srv === 'object' && !Array.isArray(srv)) {
        options = srv as InspectOptions | InspectEnvelopeOptions;
        srv = '';
      }
      if (util.isFunction(iface) && !callback) {
        callback = iface;
        iface = '';
      }
      if (util.isFunction(srv) && !iface && !callback) {
        callback = srv;
        srv = '';
        iface = '';
      }

      getStaticData().then((staticData) => {
        getDynamicData(srv as string, iface as string).then((dynamicData) => {
          const data = Object.assign(staticData, dynamicData) as AllData;
          withInspectOptions('getAllData', () => Promise.resolve(data), options, callback as Callback<AllData | InspectEnvelope<AllData>>).then((result) => resolve(result as AllData | InspectEnvelope<AllData>));
        });
      });
    });
  });
}

export function get(valueObject: GetValueObject, callback?: Callback<Record<string, unknown>>): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      const api = getPublicApi();
      const allPromises = Object.keys(valueObject)
        .filter((func) => Object.hasOwn(api, func))
        .map((func) => {
          const selector = valueObject[func as keyof GetValueObject] || '';
          const params = selector.substring(selector.lastIndexOf('(') + 1, selector.lastIndexOf(')'));
          let funcWithoutParams = func.indexOf(')') >= 0 ? func.split(')')[1].trim() : func;
          funcWithoutParams = func.indexOf('|') >= 0 ? func.split('|')[0].trim() : funcWithoutParams;
          return params ? api[funcWithoutParams](params) : api[funcWithoutParams]('');
        });

      Promise.all(allPromises).then((data) => {
        const result: Record<string, unknown> = {};
        let i = 0;
        for (const key in valueObject) {
          if (Object.hasOwn(valueObject, key) && Object.hasOwn(api, key) && data.length > i) {
            const selector = valueObject[key as keyof GetValueObject] || '';
            if (selector === '*' || selector === 'all') {
              result[key] = data[i];
            } else {
              let keys = selector;
              let filter = '';
              let filterParts: string[] = [];
              if (keys.indexOf(')') >= 0) {
                keys = keys.split(')')[1].trim();
              }
              if (keys.indexOf('|') >= 0) {
                filter = keys.split('|')[1].trim();
                filterParts = filter.split(':');
                keys = keys.split('|')[0].trim();
              }
              const requestedKeys = keys.replace(/,/g, ' ').replace(/ +/g, ' ').split(' ');
              const source = data[i];
              if (source) {
                if (Array.isArray(source)) {
                  const partialArray: Record<string, unknown>[] = [];
                  source.forEach((element: Record<string, unknown>) => {
                    let partialRes: Record<string, unknown> = {};
                    if (requestedKeys.length === 1 && (requestedKeys[0] === '*' || requestedKeys[0] === 'all')) {
                      partialRes = element;
                    } else {
                      requestedKeys.forEach((k) => {
                        if (Object.hasOwn(element, k)) {
                          partialRes[k] = element[k];
                        }
                      });
                    }
                    if (filter && filterParts.length === 2 && Object.hasOwn(partialRes, filterParts[0].trim())) {
                      const val = partialRes[filterParts[0].trim()];
                      if (typeof val === 'number' && val === parseFloat(filterParts[1].trim())) {
                        partialArray.push(partialRes);
                      } else if (typeof val === 'string' && val.toLowerCase() === filterParts[1].trim().toLowerCase()) {
                        partialArray.push(partialRes);
                      }
                    } else {
                      partialArray.push(partialRes);
                    }
                  });
                  result[key] = partialArray;
                } else if (typeof source === 'object') {
                  const partialRes: Record<string, unknown> = {};
                  requestedKeys.forEach((k) => {
                    if (Object.hasOwn(source, k)) {
                      partialRes[k] = (source as Record<string, unknown>)[k];
                    }
                  });
                  result[key] = partialRes;
                }
              } else {
                result[key] = {};
              }
            }
            i++;
          }
        }
        callback?.(result);
        resolve(result);
      });
    });
  });
}

export function select(): SelectorBuilder {
  return createSelector();
}

export function observe(valueObject: GetValueObject, interval: number, callback: Callback<Record<string, unknown>>): ObserveHandle {
  let previousData: Record<string, unknown> | null = null;
  return setInterval(() => {
    get(valueObject).then((data) => {
      if (JSON.stringify(previousData) !== JSON.stringify(data)) {
        previousData = Object.assign({}, data);
        callback(data);
      }
    });
  }, interval);
}

export async function* watch<T extends GetValueObject>(valueObject: T, options: WatchOptions = {}): AsyncIterable<GetResult<T>> {
  const intervalMs = options.intervalMs || 1000;
  let previousData = '';
  while (!options.signal?.aborted) {
    const data = (await util.withTimeout('watch', get(valueObject), options.timeoutMs || 0, options.signal)) as GetResult<T>;
    const serialized = JSON.stringify(data);
    if (!options.changedOnly || serialized !== previousData) {
      previousData = serialized;
      yield data;
    }
    await util.withTimeout('watchInterval', new Promise((resolve) => setTimeout(resolve, intervalMs)), intervalMs + 100, options.signal).catch(() => undefined);
  }
}
