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

import { VERSION as libVersion } from './version.generated';
import * as util from './util';
export * from './types';
import * as capabilityModule from './capabilities';
import * as schemaModule from './schema';
import * as osInfoModule from './osinfo';
import batteryModule from './battery';
import * as networkModule from './network';
import { normalizeOptions, withInspectOptions } from './wrap';

// All function exports below this point come from the codegen registry.
// Edit `scripts/api-registry.ts` and run `npm run codegen:api` to regenerate.
export {
  system,
  bios,
  baseboard,
  chassis,
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
  bluetoothDevices
} from './index.generated';

// Local bindings for the orchestrators (getStaticData / getDynamicData /
// getPublicApi). Consumers see the same functions via the
// `export { ... } from './index.generated'` above; these imports just give
// us callable handles inside this file.
import * as generated from './index.generated';
import {
  audio,
  baseboard,
  bios,
  bluetoothDevices,
  chassis,
  cpu,
  cpuCurrentSpeed,
  cpuFlags,
  cpuTemperature,
  currentLoad,
  diskLayout,
  disksIO,
  dockerAll,
  fsSize,
  fsStats,
  graphics,
  inetLatency,
  mem,
  memLayout,
  networkConnections,
  networkInterfaces,
  networkStats,
  osInfo,
  printer,
  processes,
  services,
  system,
  usb,
  users,
  uuid,
  versions,
  wifiNetworks
} from './index.generated';
import type {
  AllData,
  AudioData,
  BaseboardData,
  BatteryData,
  BiosData,
  BluetoothDeviceData,
  Callback,
  ChassisData,
  CpuData,
  DiagnosticData,
  DiagnosticRecord,
  DiagnosticsOptions,
  DynamicData,
  GetResult,
  GetValueObject,
  GraphicsData,
  InspectEnvelope,
  InspectEnvelopeOptions,
  InspectOptions,
  JsonSchema,
  MaybeUnsupported,
  MemLayoutData,
  NetworkInterfacesData,
  ObserveHandle,
  OsData,
  PrinterData,
  PublicFunctionName,
  SelectorBuilder,
  StaticData,
  SystemData,
  TimeData,
  UsbData,
  UserData,
  UuidData,
  VersionData,
  WatchOptions,
  CapabilityRecord
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

export const diagnostics: (options?: DiagnosticsOptions) => DiagnosticData[] = util.diagnostics as (options?: DiagnosticsOptions) => DiagnosticData[];
export const clearDiagnostics: () => void = util.clearDiagnostics;
export const onDiagnostic: (listener: (record: DiagnosticRecord) => void) => () => void = util.onDiagnostic;
export const schemaVersion: () => string = schemaModule.schemaVersion;
export const getSchema: (name?: string) => JsonSchema = schemaModule.getSchema;
export const capabilities: (options?: InspectOptions) => Promise<CapabilityRecord[]> = capabilityModule.capabilities;
export const capability: (name: PublicFunctionName, options?: InspectOptions) => Promise<CapabilityRecord> = capabilityModule.capability;

export const time: () => TimeData = osInfoModule.time;
export const battery: (callback?: Callback<BatteryData>) => Promise<BatteryData> = batteryModule;

export const powerShellStart: () => void = util.powerShellStart;
export const powerShellRelease: () => void = util.powerShellRelease;

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
    shell: generated.shell,
    uuid,
    cpu,
    cpuFlags,
    cpuCache: generated.cpuCache,
    cpuCurrentSpeed,
    cpuTemperature,
    currentLoad,
    fullLoad: generated.fullLoad,
    mem,
    memLayout,
    battery,
    graphics,
    fsSize,
    fsOpenFiles: generated.fsOpenFiles,
    blockDevices: generated.blockDevices,
    fsStats,
    disksIO,
    diskLayout,
    networkInterfaceDefault: generated.networkInterfaceDefault,
    networkGatewayDefault: generated.networkGatewayDefault,
    networkInterfaces,
    networkStats,
    networkConnections,
    wifiNetworks,
    wifiInterfaces: generated.wifiInterfaces,
    wifiConnections: generated.wifiConnections,
    services,
    processes,
    processLoad: generated.processLoad,
    users,
    inetChecksite: generated.inetChecksite,
    inetLatency,
    dockerInfo: generated.dockerInfo,
    dockerImages: generated.dockerImages,
    dockerContainers: generated.dockerContainers,
    dockerContainerStats: generated.dockerContainerStats,
    dockerContainerProcesses: generated.dockerContainerProcesses,
    dockerVolumes: generated.dockerVolumes,
    dockerAll,
    vboxInfo: generated.vboxInfo,
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
