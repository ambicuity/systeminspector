// ==================================================================================
// docker.js
// ----------------------------------------------------------------------------------
// Description:   System Inspector - library
//                for Node.js
// Copyright:     (c) 2026 Project Contributors
// Maintainers:   Project Contributors
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 13. Docker
// ----------------------------------------------------------------------------------

import DockerSocket from './dockerSocket';
import * as util from './util';
import type {
  Callback,
  DockerContainerData,
  DockerContainerProcessData,
  DockerContainerStatsData,
  DockerImageData,
  DockerInfoData,
  DockerVolumeData
} from './types';

const _platform = process.platform;
const _windows = _platform === 'win32';

const _docker_container_stats: Record<string, unknown> = {};
let _docker_socket: DockerSocket | undefined;
let _docker_last_read = 0;

// --------------------------
// get containers (parameter all: get also inactive/exited containers)

export function dockerInfo(callback?: Callback<DockerInfoData>): Promise<DockerInfoData> {
  return new Promise<DockerInfoData>((resolve) => {
    process.nextTick(() => {
      if (!_docker_socket) {
        _docker_socket = new DockerSocket();
      }
      const result = {} as DockerInfoData;

      _docker_socket.getInfo((data: any) => {
        result.id = data.ID;
        result.containers = data.Containers;
        result.containersRunning = data.ContainersRunning;
        result.containersPaused = data.ContainersPaused;
        result.containersStopped = data.ContainersStopped;
        result.images = data.Images;
        result.driver = data.Driver;
        result.memoryLimit = data.MemoryLimit;
        result.swapLimit = data.SwapLimit;
        result.kernelMemory = data.KernelMemory;
        result.cpuCfsPeriod = data.CpuCfsPeriod;
        result.cpuCfsQuota = data.CpuCfsQuota;
        result.cpuShares = data.CPUShares;
        result.cpuSet = data.CPUSet;
        result.ipv4Forwarding = data.IPv4Forwarding;
        result.bridgeNfIptables = data.BridgeNfIptables;
        result.bridgeNfIp6tables = data.BridgeNfIp6tables;
        result.debug = data.Debug;
        result.nfd = data.NFd;
        result.oomKillDisable = data.OomKillDisable;
        result.ngoroutines = data.NGoroutines;
        result.systemTime = data.SystemTime;
        result.loggingDriver = data.LoggingDriver;
        result.cgroupDriver = data.CgroupDriver;
        result.nEventsListener = data.NEventsListener;
        result.kernelVersion = data.KernelVersion;
        result.operatingSystem = data.OperatingSystem;
        result.osType = data.OSType;
        result.architecture = data.Architecture;
        result.ncpu = data.NCPU;
        result.memTotal = data.MemTotal;
        result.dockerRootDir = data.DockerRootDir;
        result.httpProxy = data.HttpProxy;
        result.httpsProxy = data.HttpsProxy;
        result.noProxy = data.NoProxy;
        result.name = data.Name;
        result.labels = data.Labels;
        result.experimentalBuild = data.ExperimentalBuild;
        result.serverVersion = data.ServerVersion;
        result.clusterStore = data.ClusterStore;
        result.clusterAdvertise = data.ClusterAdvertise;
        result.defaultRuntime = data.DefaultRuntime;
        result.liveRestoreEnabled = data.LiveRestoreEnabled;
        result.isolation = data.Isolation;
        result.initBinary = data.InitBinary;
        result.productLicense = data.ProductLicense;
        if (callback) {
          callback(result);
        }
        resolve(result);
      });
    });
  });
}

export function dockerImages(all?: boolean | string | Callback<DockerImageData[]>, callback?: Callback<DockerImageData[]>): Promise<DockerImageData[]> {
  // fallback - if only callback is given
  if (util.isFunction(all) && !callback) {
    callback = all as Callback<DockerImageData[]>;
    all = false;
  }
  if (typeof all === 'string' && all === 'true') {
    all = true;
  }
  if (typeof all !== 'boolean' && all !== undefined) {
    all = false;
  }

  all = all || false;
  const result: DockerImageData[] = [];
  return new Promise<DockerImageData[]>((resolve) => {
    process.nextTick(() => {
      if (!_docker_socket) {
        _docker_socket = new DockerSocket();
      }
      const workload: Promise<DockerImageData | undefined>[] = [];

      _docker_socket.listImages(all, (data: any) => {
        let dockerImages: any = {};
        try {
          dockerImages = data;
          if (dockerImages && Object.prototype.toString.call(dockerImages) === '[object Array]' && dockerImages.length > 0) {
            dockerImages.forEach((element: any) => {
              if (element.Names && Object.prototype.toString.call(element.Names) === '[object Array]' && element.Names.length > 0) {
                element.Name = element.Names[0].replace(/^\/|\/$/g, '');
              }
              workload.push(dockerImagesInspect(element.Id.trim(), element));
            });
            if (workload.length) {
              Promise.all(workload).then((data) => {
                const validData = data.filter((d): d is DockerImageData => d !== undefined);
                if (callback) {
                  callback(validData);
                }
                resolve(validData);
              });
            } else {
              if (callback) {
                callback(result);
              }
              resolve(result);
            }
          } else {
            if (callback) {
              callback(result);
            }
            resolve(result);
          }
        } catch {
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      });
    });
  });
}

// --------------------------
// container inspect (for one container)

function dockerImagesInspect(imageID: string, payload: any): Promise<DockerImageData | undefined> {
  return new Promise<DockerImageData | undefined>((resolve) => {
    process.nextTick(() => {
      imageID = imageID || '';
      if (typeof imageID !== 'string') {
        return resolve(undefined);
      }
      const imageIDSanitized = (util.isPrototypePolluted() ? '' : util.sanitizeShellString(imageID, true)).trim();
      if (imageIDSanitized) {
        if (!_docker_socket) {
          _docker_socket = new DockerSocket();
        }

        _docker_socket.inspectImage(imageIDSanitized.trim(), (data: any) => {
          try {
            resolve({
              id: payload.Id,
              container: data.Container,
              comment: data.Comment,
              os: data.Os,
              architecture: data.Architecture,
              parent: data.Parent,
              dockerVersion: data.DockerVersion,
              size: data.Size,
              sharedSize: payload.SharedSize,
              virtualSize: data.VirtualSize,
              author: data.Author,
              created: data.Created ? Math.round(new Date(data.Created).getTime() / 1000) : 0,
              containerConfig: data.ContainerConfig ? data.ContainerConfig : {},
              graphDriver: data.GraphDriver ? data.GraphDriver : {},
              repoDigests: data.RepoDigests ? data.RepoDigests : {},
              repoTags: data.RepoTags ? data.RepoTags : {},
              config: data.Config ? data.Config : {},
              rootFS: data.RootFS ? data.RootFS : {}
            });
          } catch {
            resolve(undefined);
          }
        });
      } else {
        resolve(undefined);
      }
    });
  });
}

export function dockerContainers(all?: boolean | string | Callback<DockerContainerData[]>, callback?: Callback<DockerContainerData[]>): Promise<DockerContainerData[]> {
  function inContainers(containers: any[], id: string): boolean {
    const filtered = containers.filter((obj) => {
      /**
       * @namespace
       * @property {string}  Id
       */
      return obj.Id && obj.Id === id;
    });
    return filtered.length > 0;
  }

  // fallback - if only callback is given
  if (util.isFunction(all) && !callback) {
    callback = all as Callback<DockerContainerData[]>;
    all = false;
  }
  if (typeof all === 'string' && all === 'true') {
    all = true;
  }
  if (typeof all !== 'boolean' && all !== undefined) {
    all = false;
  }

  all = all || false;
  const result: DockerContainerData[] = [];
  return new Promise<DockerContainerData[]>((resolve) => {
    process.nextTick(() => {
      if (!_docker_socket) {
        _docker_socket = new DockerSocket();
      }
      const workload: Promise<DockerContainerData | undefined>[] = [];

      _docker_socket.listContainers(all, (data: any) => {
        let docker_containers: any = {};
        try {
          docker_containers = data;
          if (docker_containers && Object.prototype.toString.call(docker_containers) === '[object Array]' && docker_containers.length > 0) {
            // GC in _docker_container_stats
            for (const key in _docker_container_stats) {
              if (Object.hasOwn(_docker_container_stats, key)) {
                if (!inContainers(docker_containers, key)) {
                  delete _docker_container_stats[key];
                }
              }
            }

            docker_containers.forEach((element: any) => {
              if (element.Names && Object.prototype.toString.call(element.Names) === '[object Array]' && element.Names.length > 0) {
                element.Name = element.Names[0].replace(/^\/|\/$/g, '');
              }
              workload.push(dockerContainerInspect(element.Id.trim(), element));
            });
            if (workload.length) {
              Promise.all(workload).then((data) => {
                const validData = data.filter((d): d is DockerContainerData => d !== undefined);
                if (callback) {
                  callback(validData);
                }
                resolve(validData);
              });
            } else {
              if (callback) {
                callback(result);
              }
              resolve(result);
            }
          } else {
            if (callback) {
              callback(result);
            }
            resolve(result);
          }
        } catch (err) {
          // GC in _docker_container_stats
          for (const key in _docker_container_stats) {
            if (Object.hasOwn(_docker_container_stats, key)) {
              if (!inContainers(docker_containers, key)) {
                delete _docker_container_stats[key];
              }
            }
          }
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      });
    });
  });
}

// --------------------------
// container inspect (for one container)

function dockerContainerInspect(containerID: string, payload: any): Promise<DockerContainerData | undefined> {
  return new Promise<DockerContainerData | undefined>((resolve) => {
    process.nextTick(() => {
      containerID = containerID || '';
      if (typeof containerID !== 'string') {
        return resolve(undefined);
      }
      const containerIdSanitized = (util.isPrototypePolluted() ? '' : util.sanitizeShellString(containerID, true)).trim();
      if (containerIdSanitized) {
        if (!_docker_socket) {
          _docker_socket = new DockerSocket();
        }

        _docker_socket.getInspect(containerIdSanitized.trim(), (data: any) => {
          try {
            resolve({
              id: payload.Id,
              name: payload.Name,
              image: payload.Image,
              imageID: payload.ImageID,
              command: payload.Command,
              created: payload.Created,
              started: data.State && data.State.StartedAt ? Math.round(new Date(data.State.StartedAt).getTime() / 1000) : 0,
              finished: data.State && data.State.FinishedAt && !data.State.FinishedAt.startsWith('0001-01-01') ? Math.round(new Date(data.State.FinishedAt).getTime() / 1000) : 0,
              createdAt: data.Created ? data.Created : '',
              startedAt: data.State && data.State.StartedAt ? data.State.StartedAt : '',
              finishedAt: data.State && data.State.FinishedAt && !data.State.FinishedAt.startsWith('0001-01-01') ? data.State.FinishedAt : '',
              state: payload.State,
              restartCount: data.RestartCount || 0,
              platform: data.Platform || '',
              driver: data.Driver || '',
              ports: payload.Ports,
              mounts: payload.Mounts
              // hostconfig: payload.HostConfig,
              // network: payload.NetworkSettings
            });
          } catch {
            resolve(undefined);
          }
        });
      } else {
        resolve(undefined);
      }
    });
  });
}

// --------------------------
// helper functions for calculation of docker stats

function docker_calcCPUPercent(cpu_stats: any, precpu_stats: any): number {
  /**
   * @namespace
   * @property {object}  cpu_usage
   * @property {number}  cpu_usage.total_usage
   * @property {number}  system_cpu_usage
   * @property {object}  cpu_usage
   * @property {Array}  cpu_usage.percpu_usage
   */

  if (!_windows) {
    let cpuPercent = 0.0;
    // calculate the change for the cpu usage of the container in between readings
    const cpuDelta = cpu_stats.cpu_usage.total_usage - precpu_stats.cpu_usage.total_usage;
    // calculate the change for the entire system between readings
    const systemDelta = cpu_stats.system_cpu_usage - precpu_stats.system_cpu_usage;

    if (systemDelta > 0.0 && cpuDelta > 0.0) {
      // calculate the change for the cpu usage of the container in between readings
      if (precpu_stats.online_cpus) {
        cpuPercent = (cpuDelta / systemDelta) * precpu_stats.online_cpus * 100.0;
      } else {
        cpuPercent = (cpuDelta / systemDelta) * cpu_stats.cpu_usage.percpu_usage.length * 100.0;
      }
    }

    return cpuPercent;
  } else {
    const nanoSecNow = util.nanoSeconds();
    let cpuPercent = 0.0;
    if (_docker_last_read > 0) {
      const possIntervals = nanoSecNow - _docker_last_read; //  / 100 * os.cpus().length;
      const intervalsUsed = cpu_stats.cpu_usage.total_usage - precpu_stats.cpu_usage.total_usage;
      if (possIntervals > 0) {
        cpuPercent = (100.0 * intervalsUsed) / possIntervals;
      }
    }
    _docker_last_read = nanoSecNow;
    return cpuPercent;
  }
}

function docker_calcNetworkIO(networks: Record<string, any>): { rx: number; wx: number } {
  let rx = 0;
  let wx = 0;
  for (const key in networks) {
    // skip loop if the property is from prototype
    if (!Object.hasOwn(networks, key)) {
      continue;
    }

    /**
     * @namespace
     * @property {number}  rx_bytes
     * @property {number}  tx_bytes
     */
    const obj = networks[key];
    rx = +obj.rx_bytes;
    wx = +obj.tx_bytes;
  }
  return {
    rx,
    wx
  };
}

function docker_calcBlockIO(blkio_stats: any): { r: number; w: number } {
  const result = {
    r: 0,
    w: 0
  };

  /**
   * @namespace
   * @property {Array}  io_service_bytes_recursive
   */
  if (
    blkio_stats &&
    blkio_stats.io_service_bytes_recursive &&
    Object.prototype.toString.call(blkio_stats.io_service_bytes_recursive) === '[object Array]' &&
    blkio_stats.io_service_bytes_recursive.length > 0
  ) {
    blkio_stats.io_service_bytes_recursive.forEach((element: any) => {
      /**
       * @namespace
       * @property {string}  op
       * @property {number}  value
       */

      if (element.op && element.op.toLowerCase() === 'read' && element.value) {
        result.r += element.value;
      }
      if (element.op && element.op.toLowerCase() === 'write' && element.value) {
        result.w += element.value;
      }
    });
  }
  return result;
}

export function dockerContainerStats(containerIDs?: string | Callback<DockerContainerStatsData[]>, callback?: Callback<DockerContainerStatsData[]>): Promise<DockerContainerStatsData[]> {
  let containerArray: string[] = [];
  return new Promise<DockerContainerStatsData[]>((resolve) => {
    process.nextTick(() => {
      // fallback - if only callback is given
      if (util.isFunction(containerIDs) && !callback) {
        callback = containerIDs as Callback<DockerContainerStatsData[]>;
        containerArray = ['*'];
      } else {
        containerIDs = containerIDs || '*';
        if (typeof containerIDs !== 'string') {
          if (callback) {
            callback([]);
          }
          return resolve([]);
        }
        let containerIDsSanitized = '';
        util.restoreStringPrototype(containerIDsSanitized);

        containerIDsSanitized = containerIDs;
        containerIDsSanitized = containerIDsSanitized.trim();
        if (containerIDsSanitized !== '*') {
          containerIDsSanitized = '';
          const s = (util.isPrototypePolluted() ? '' : util.sanitizeShellString(containerIDs, true)).trim();
          const l = util.mathMin(s.length, 2000);
          for (let i = 0; i <= l; i++) {
            if (s[i] !== undefined) {
              util.restoreStringPrototype(s[i]);
              const sl = s[i].toLowerCase();
              if (sl && sl[0] && !sl[1]) {
                containerIDsSanitized = containerIDsSanitized + sl[0];
              }
            }
          }
        }

        containerIDsSanitized = containerIDsSanitized.trim().toLowerCase().replace(/,+/g, '|');
        containerArray = containerIDsSanitized.split('|');
      }

      const result: DockerContainerStatsData[] = [];

      const workload: Promise<DockerContainerStatsData>[] = [];
      if (containerArray.length && containerArray[0].trim() === '*') {
        containerArray = [];
        dockerContainers().then((allContainers) => {
          for (const container of allContainers) {
            containerArray.push(container.id.substring(0, 12));
          }
          if (containerArray.length) {
            dockerContainerStats(containerArray.join(',')).then((result) => {
              if (callback) {
                callback(result);
              }
              resolve(result);
            });
          } else {
            if (callback) {
              callback(result);
            }
            resolve(result);
          }
        });
      } else {
        for (const containerID of containerArray) {
          workload.push(dockerContainerStatsSingle(containerID.trim()));
        }
        if (workload.length) {
          Promise.all(workload).then((data) => {
            if (callback) {
              callback(data);
            }
            resolve(data);
          });
        } else {
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      }
    });
  });
}

// --------------------------
// container stats (for one container)

function dockerContainerStatsSingle(containerID: string): Promise<DockerContainerStatsData> {
  containerID = containerID || '';
  const result = {
    id: containerID,
    memUsage: 0,
    memLimit: 0,
    memPercent: 0,
    cpuPercent: 0,
    pids: 0,
    netIO: {
      rx: 0,
      wx: 0
    },
    blockIO: {
      r: 0,
      w: 0
    },
    restartCount: 0,
    cpuStats: {},
    precpuStats: {},
    memoryStats: {},
    networks: {}
  };
  return new Promise<DockerContainerStatsData>((resolve) => {
    process.nextTick(() => {
      if (containerID) {
        if (!_docker_socket) {
          _docker_socket = new DockerSocket();
        }

        _docker_socket.getInspect(containerID, (dataInspect: any) => {
          try {
            _docker_socket!.getStats(containerID, (data: any) => {
              try {
                const stats = data;
                if (!stats.message) {
                  if (data.id) {
                    result.id = data.id;
                  }
                  result.memUsage = stats.memory_stats && stats.memory_stats.usage ? stats.memory_stats.usage : 0;
                  result.memLimit = stats.memory_stats && stats.memory_stats.limit ? stats.memory_stats.limit : 0;
                  result.memPercent = stats.memory_stats && stats.memory_stats.usage && stats.memory_stats.limit ? (stats.memory_stats.usage / stats.memory_stats.limit) * 100.0 : 0;
                  result.cpuPercent = stats.cpu_stats && stats.precpu_stats ? docker_calcCPUPercent(stats.cpu_stats, stats.precpu_stats) : 0;
                  result.pids = stats.pids_stats && stats.pids_stats.current ? stats.pids_stats.current : 0;
                  result.restartCount = dataInspect.RestartCount ? dataInspect.RestartCount : 0;
                  if (stats.networks) {
                    result.netIO = docker_calcNetworkIO(stats.networks);
                  }
                  if (stats.blkio_stats) {
                    result.blockIO = docker_calcBlockIO(stats.blkio_stats);
                  }
                  result.cpuStats = stats.cpu_stats ? stats.cpu_stats : {};
                  result.precpuStats = stats.precpu_stats ? stats.precpu_stats : {};
                  result.memoryStats = stats.memory_stats ? stats.memory_stats : {};
                  result.networks = stats.networks ? stats.networks : {};
                }
              } catch {
                util.noop();
              }
              // }
              resolve(result);
            });
          } catch {
            util.noop();
          }
        });
      } else {
        resolve(result);
      }
    });
  });
}

// --------------------------
// container processes (for one container)

export function dockerContainerProcesses(containerID?: string, callback?: Callback<DockerContainerProcessData[]>): Promise<DockerContainerProcessData[]> {
  const result: DockerContainerProcessData[] = [];
  return new Promise<DockerContainerProcessData[]>((resolve) => {
    process.nextTick(() => {
      containerID = containerID || '';
      if (typeof containerID !== 'string') {
        return resolve(result);
      }
      const containerIdSanitized = (util.isPrototypePolluted() ? '' : util.sanitizeShellString(containerID, true)).trim();

      if (containerIdSanitized) {
        if (!_docker_socket) {
          _docker_socket = new DockerSocket();
        }

        _docker_socket.getProcesses(containerIdSanitized, (data: any) => {
          /**
           * @namespace
           * @property {Array}  Titles
           * @property {Array}  Processes
           **/
          try {
            if (data && data.Titles && data.Processes) {
              const titles = data.Titles.map((value: any) => value.toUpperCase());
              const pos_pid = titles.indexOf('PID');
              const pos_ppid = titles.indexOf('PPID');
              const pos_pgid = titles.indexOf('PGID');
              const pos_vsz = titles.indexOf('VSZ');
              const pos_time = titles.indexOf('TIME');
              const pos_elapsed = titles.indexOf('ELAPSED');
              const pos_ni = titles.indexOf('NI');
              const pos_ruser = titles.indexOf('RUSER');
              const pos_user = titles.indexOf('USER');
              const pos_rgroup = titles.indexOf('RGROUP');
              const pos_group = titles.indexOf('GROUP');
              const pos_stat = titles.indexOf('STAT');
              const pos_rss = titles.indexOf('RSS');
              const pos_command = titles.indexOf('COMMAND');

              data.Processes.forEach((process: any) => {
                result.push({
                  pidHost: pos_pid >= 0 ? process[pos_pid] : '',
                  ppid: pos_ppid >= 0 ? process[pos_ppid] : '',
                  pgid: pos_pgid >= 0 ? process[pos_pgid] : '',
                  user: pos_user >= 0 ? process[pos_user] : '',
                  ruser: pos_ruser >= 0 ? process[pos_ruser] : '',
                  group: pos_group >= 0 ? process[pos_group] : '',
                  rgroup: pos_rgroup >= 0 ? process[pos_rgroup] : '',
                  stat: pos_stat >= 0 ? process[pos_stat] : '',
                  time: pos_time >= 0 ? process[pos_time] : '',
                  elapsed: pos_elapsed >= 0 ? process[pos_elapsed] : '',
                  nice: pos_ni >= 0 ? process[pos_ni] : '',
                  rss: pos_rss >= 0 ? process[pos_rss] : '',
                  vsz: pos_vsz >= 0 ? process[pos_vsz] : '',
                  command: pos_command >= 0 ? process[pos_command] : ''
                });
              });
            }
          } catch {
            util.noop();
          }
          if (callback) {
            callback(result);
          }
          resolve(result);
        });
      } else {
        if (callback) {
          callback(result);
        }
        resolve(result);
      }
    });
  });
}

export function dockerVolumes(callback?: Callback<DockerVolumeData[]>): Promise<DockerVolumeData[]> {
  const result: DockerVolumeData[] = [];
  return new Promise<DockerVolumeData[]>((resolve) => {
    process.nextTick(() => {
      if (!_docker_socket) {
        _docker_socket = new DockerSocket();
      }
      _docker_socket.listVolumes((data: any) => {
        let dockerVolumes: any = {};
        try {
          dockerVolumes = data;
          if (dockerVolumes && dockerVolumes.Volumes && Object.prototype.toString.call(dockerVolumes.Volumes) === '[object Array]' && dockerVolumes.Volumes.length > 0) {
            dockerVolumes.Volumes.forEach((element: any) => {
              result.push({
                name: element.Name,
                driver: element.Driver,
                labels: element.Labels,
                mountpoint: element.Mountpoint,
                options: element.Options,
                scope: element.Scope,
                created: element.CreatedAt ? Math.round(new Date(element.CreatedAt).getTime() / 1000) : 0
              });
            });
            if (callback) {
              callback(result);
            }
            resolve(result);
          } else {
            if (callback) {
              callback(result);
            }
            resolve(result);
          }
        } catch {
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      });
    });
  });
}

export function dockerAll(callback?: Callback<any[]>): Promise<any[]> {
  return new Promise<any[]>((resolve) => {
    process.nextTick(() => {
      dockerContainers(true).then((result) => {
        if (result && Object.prototype.toString.call(result) === '[object Array]' && result.length > 0) {
          let l = result.length;
          result.forEach((element: any) => {
            dockerContainerStats(element.id).then((res) => {
              // include stats in array
              element.memUsage = res[0].memUsage;
              element.memLimit = res[0].memLimit;
              element.memPercent = res[0].memPercent;
              element.cpuPercent = res[0].cpuPercent;
              element.pids = res[0].pids;
              element.netIO = res[0].netIO;
              element.blockIO = res[0].blockIO;
              element.cpuStats = res[0].cpuStats;
              element.precpuStats = res[0].precpuStats;
              element.memoryStats = res[0].memoryStats;
              element.networks = res[0].networks;

              dockerContainerProcesses(element.id).then((processes) => {
                element.processes = processes;

                l -= 1;
                if (l === 0) {
                  if (callback) {
                    callback(result);
                  }
                  resolve(result);
                }
              });
              // all done??
            });
          });
        } else {
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      });
    });
  });
}
