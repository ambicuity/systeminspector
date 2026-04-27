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
  GraphicsData,
  InetChecksiteData,
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
  WifiNetworkData
} from './types';

const _platform = process.platform;
const _windows = _platform === 'win32';
const _freebsd = _platform === 'freebsd';
const _openbsd = _platform === 'openbsd';
const _netbsd = _platform === 'netbsd';
const _sunos = _platform === 'sunos';

type PublicApi = Record<string, any>;

if (_windows) {
  util.getCodepage();
  util.getPowershell();
}

export function version(): string {
  return libVersion;
}

export const diagnostics: () => DiagnosticData[] = util.diagnostics as () => DiagnosticData[];
export const clearDiagnostics: () => void = util.clearDiagnostics;

export const system: (callback?: Callback<SystemData>) => Promise<SystemData> = systemModule.system;
export const bios: (callback?: Callback<BiosData>) => Promise<BiosData> = systemModule.bios;
export const baseboard: (callback?: Callback<BaseboardData>) => Promise<BaseboardData> = systemModule.baseboard;
export const chassis: (callback?: Callback<ChassisData>) => Promise<ChassisData> = systemModule.chassis;

export const time: () => TimeData = osInfoModule.time;
export const osInfo: (callback?: Callback<OsData>) => Promise<OsData> = osInfoModule.osInfo as unknown as (callback?: Callback<OsData>) => Promise<OsData>;
export const versions: (apps?: string | Callback<VersionData>, callback?: Callback<VersionData>) => Promise<VersionData> = osInfoModule.versions as unknown as (apps?: string | Callback<VersionData>, callback?: Callback<VersionData>) => Promise<VersionData>;
export const shell: (callback?: Callback<string>) => Promise<string> = osInfoModule.shell as unknown as (callback?: Callback<string>) => Promise<string>;
export const uuid: (callback?: Callback<UuidData>) => Promise<UuidData> = osInfoModule.uuid as unknown as (callback?: Callback<UuidData>) => Promise<UuidData>;

export const cpu: (callback?: Callback<CpuData>) => Promise<CpuData> = cpuModule.cpu as unknown as (callback?: Callback<CpuData>) => Promise<CpuData>;
export const cpuFlags: (callback?: Callback<string>) => Promise<string> = cpuModule.cpuFlags as unknown as (callback?: Callback<string>) => Promise<string>;
export const cpuCache: (callback?: Callback<CpuCacheData>) => Promise<CpuCacheData> = cpuModule.cpuCache as unknown as (callback?: Callback<CpuCacheData>) => Promise<CpuCacheData>;
export const cpuCurrentSpeed: (callback?: Callback<CpuCurrentSpeedData>) => Promise<CpuCurrentSpeedData> = cpuModule.cpuCurrentSpeed as unknown as (callback?: Callback<CpuCurrentSpeedData>) => Promise<CpuCurrentSpeedData>;
export const cpuTemperature: (callback?: Callback<CpuTemperatureData>) => Promise<CpuTemperatureData> = cpuModule.cpuTemperature as unknown as (callback?: Callback<CpuTemperatureData>) => Promise<CpuTemperatureData>;
export const currentLoad: (callback?: Callback<CurrentLoadData>) => Promise<CurrentLoadData> = cpuModule.currentLoad as unknown as (callback?: Callback<CurrentLoadData>) => Promise<CurrentLoadData>;
export const fullLoad: (callback?: Callback<number>) => Promise<number> = cpuModule.fullLoad as unknown as (callback?: Callback<number>) => Promise<number>;

export const mem: (callback?: Callback<MemData>) => Promise<MemData> = memoryModule.mem;
export const memLayout: (callback?: Callback<MemLayoutData[]>) => Promise<MemLayoutData[]> = memoryModule.memLayout;

export const battery: (callback?: Callback<BatteryData>) => Promise<BatteryData> = batteryModule;
export const graphics: (callback?: Callback<MaybeUnsupported<GraphicsData>>) => Promise<MaybeUnsupported<GraphicsData>> = graphicsModule.graphics as unknown as (callback?: Callback<MaybeUnsupported<GraphicsData>>) => Promise<MaybeUnsupported<GraphicsData>>;

export const fsSize: (drive?: string | Callback<FsSizeData[]>, callback?: Callback<FsSizeData[]>) => Promise<FsSizeData[]> = filesystemModule.fsSize as unknown as (drive?: string | Callback<FsSizeData[]>, callback?: Callback<FsSizeData[]>) => Promise<FsSizeData[]>;
export const fsOpenFiles: (callback?: Callback<FsOpenFilesData>) => Promise<FsOpenFilesData> = filesystemModule.fsOpenFiles as unknown as (callback?: Callback<FsOpenFilesData>) => Promise<FsOpenFilesData>;
export const blockDevices: (callback?: Callback<BlockDevicesData[]>) => Promise<BlockDevicesData[]> = filesystemModule.blockDevices as unknown as (callback?: Callback<BlockDevicesData[]>) => Promise<BlockDevicesData[]>;
export const fsStats: (callback?: Callback<FsStatsData>) => Promise<FsStatsData> = filesystemModule.fsStats as unknown as (callback?: Callback<FsStatsData>) => Promise<FsStatsData>;
export const disksIO: (callback?: Callback<DisksIoData>) => Promise<DisksIoData> = filesystemModule.disksIO as unknown as (callback?: Callback<DisksIoData>) => Promise<DisksIoData>;
export const diskLayout: (callback?: Callback<DiskLayoutData[]>) => Promise<DiskLayoutData[]> = filesystemModule.diskLayout as unknown as (callback?: Callback<DiskLayoutData[]>) => Promise<DiskLayoutData[]>;

export const networkInterfaceDefault: (callback?: Callback<string>) => Promise<string> = networkModule.networkInterfaceDefault as unknown as (callback?: Callback<string>) => Promise<string>;
export const networkGatewayDefault: (callback?: Callback<string>) => Promise<string> = networkModule.networkGatewayDefault as unknown as (callback?: Callback<string>) => Promise<string>;
export const networkInterfaces: (
  callback?: Callback<NetworkInterfacesData[]> | boolean | string,
  rescan?: boolean,
  defaultString?: string
) => Promise<NetworkInterfacesData[]> = networkModule.networkInterfaces as unknown as (callback?: Callback<NetworkInterfacesData[]> | boolean | string, rescan?: boolean, defaultString?: string) => Promise<NetworkInterfacesData[]>;
export const networkStats: (ifaces?: string | Callback<NetworkStatsData[]>, callback?: Callback<NetworkStatsData[]>) => Promise<NetworkStatsData[]> = networkModule.networkStats as unknown as (ifaces?: string | Callback<NetworkStatsData[]>, callback?: Callback<NetworkStatsData[]>) => Promise<NetworkStatsData[]>;
export const networkConnections: (callback?: Callback<NetworkConnectionsData[]>) => Promise<NetworkConnectionsData[]> = networkModule.networkConnections as unknown as (callback?: Callback<NetworkConnectionsData[]>) => Promise<NetworkConnectionsData[]>;

export const wifiNetworks: (callback?: Callback<MaybeUnsupported<WifiNetworkData[]>>) => Promise<MaybeUnsupported<WifiNetworkData[]>> = wifiModule.wifiNetworks;
export const wifiInterfaces: (callback?: Callback<WifiInterfaceData[]>) => Promise<WifiInterfaceData[]> = wifiModule.wifiInterfaces;
export const wifiConnections: (callback?: Callback<WifiConnectionData[]>) => Promise<WifiConnectionData[]> = wifiModule.wifiConnections;

export const services: (srv?: string | Callback<ServicesData[]>, callback?: Callback<ServicesData[]>) => Promise<ServicesData[]> = processesModule.services as unknown as (srv?: string | Callback<ServicesData[]>, callback?: Callback<ServicesData[]>) => Promise<ServicesData[]>;
export const processes: (callback?: Callback<ProcessesData>) => Promise<ProcessesData> = processesModule.processes as unknown as (callback?: Callback<ProcessesData>) => Promise<ProcessesData>;
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
export const dockerAll: (callback?: Callback<any[]>) => Promise<any[]> = dockerModule.dockerAll;

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

export function getStaticData(callback?: Callback<StaticData>): Promise<StaticData> {
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
        callback?.(data);
        resolve(data);
      });
    });
  });
}

export function getDynamicData(callback?: Callback<Partial<DynamicData>>): Promise<Partial<DynamicData>>;
export function getDynamicData(srv?: string, callback?: Callback<Partial<DynamicData>>): Promise<Partial<DynamicData>>;
export function getDynamicData(srv?: string, iface?: string, callback?: Callback<Partial<DynamicData>>): Promise<Partial<DynamicData>>;
export function getDynamicData(
  srv?: string | Callback<Partial<DynamicData>>,
  iface?: string | Callback<Partial<DynamicData>>,
  callback?: Callback<Partial<DynamicData>>
): Promise<Partial<DynamicData>> {
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
        callback?.(data);
        resolve(data);
      });
    });
  });
}

export function getAllData(callback?: Callback<AllData>): Promise<AllData>;
export function getAllData(srv?: string, callback?: Callback<AllData>): Promise<AllData>;
export function getAllData(srv?: string, iface?: string, callback?: Callback<AllData>): Promise<AllData>;
export function getAllData(srv?: string | Callback<AllData>, iface?: string | Callback<AllData>, callback?: Callback<AllData>): Promise<AllData> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      if (util.isFunction(iface) && !callback) {
        callback = iface as Callback<AllData>;
        iface = '';
      }
      if (util.isFunction(srv) && !iface && !callback) {
        callback = srv as Callback<AllData>;
        srv = '';
        iface = '';
      }

      getStaticData().then((staticData) => {
        getDynamicData(srv as string, iface as string).then((dynamicData) => {
          const data = Object.assign(staticData, dynamicData) as AllData;
          callback?.(data);
          resolve(data);
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
        .filter((func) => Object.prototype.hasOwnProperty.call(api, func))
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
          if (Object.prototype.hasOwnProperty.call(valueObject, key) && Object.prototype.hasOwnProperty.call(api, key) && data.length > i) {
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
                        if (Object.prototype.hasOwnProperty.call(element, k)) {
                          partialRes[k] = element[k];
                        }
                      });
                    }
                    if (filter && filterParts.length === 2 && Object.prototype.hasOwnProperty.call(partialRes, filterParts[0].trim())) {
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
                    if (Object.prototype.hasOwnProperty.call(source, k)) {
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
