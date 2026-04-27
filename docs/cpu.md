---
description: "Complete SystemInspector documentation and API reference for Cpu. Retrieve detailed hardware and system telemetry in Node.js."
---

# CPU Information

Retrieve detailed CPU information including brand, speed, cores, and physical layout.

## `si.cpu()`

Returns a Promise with a detailed CPU data object.

```javascript
const si = require('@ambicuity/systeminspector');

si.cpu()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Return Object

| Property | Type | Description |
| --- | --- | --- |
| `manufacturer` | string | e.g. 'Intel(R)' |
| `brand` | string | e.g. 'Core(TM) i7-8550U' |
| `vendor` | string | e.g. 'GenuineIntel' |
| `family` | string | CPU Family |
| `model` | string | CPU Model |
| `stepping` | string | CPU Stepping |
| `revision` | string | CPU Revision |
| `voltage` | string | CPU Voltage |
| `speed` | number | Base speed in GHz |
| `speedMin` | number | Minimum speed in GHz |
| `speedMax` | number | Maximum speed in GHz |
| `governor` | string | CPU scaling governor when available |
| `cores` | number | Number of logical cores |
| `physicalCores` | number | Number of physical cores |
| `performanceCores` | number | Performance core count on hybrid CPUs when available |
| `efficiencyCores` | number | Efficiency core count on hybrid CPUs when available |
| `processors` | number | Number of sockets |
| `socket` | string | Socket type |
| `flags` | string | CPU feature flags |
| `virtualization` | boolean | Whether CPU virtualization support is detected |
| `cache` | object | Cache details (l1d, l1i, l2, l3) |

## CPU Flags

Retrieve CPU flags for virtualization, hyperthreading, etc.

## `si.cpuFlags()`

Returns a Promise with a string of space-separated CPU flags.

```javascript
si.cpuFlags()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

## `si.cpuCache()`

Returns cache sizes in bytes.

```javascript
si.cpuCache()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

| Property | Type | Description |
| --- | --- | --- |
| `l1d` | number | L1 data cache size |
| `l1i` | number | L1 instruction cache size |
| `l2` | number | L2 cache size |
| `l3` | number | L3 cache size |

## `si.cpuCurrentSpeed()`

Returns current CPU clock speed information in GHz.

```javascript
si.cpuCurrentSpeed()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

| Property | Type | Description |
| --- | --- | --- |
| `min` | number | Minimum current core speed |
| `max` | number | Maximum current core speed |
| `avg` | number | Average current core speed |
| `cores` | number[] | Current speed by core |

## `si.cpuTemperature()`

Returns best-effort CPU temperature readings when the platform exposes them.

| Property | Type | Description |
| --- | --- | --- |
| `main` | number | Main CPU temperature |
| `cores` | number[] | Per-core temperatures |
| `max` | number | Maximum reported CPU temperature |
| `socket` | number[] | Socket temperatures when available |
| `chipset` | number | Chipset temperature when available |

## `si.currentLoad()`

Returns aggregate and per-core CPU load percentages plus raw tick counters.

| Property | Type | Description |
| --- | --- | --- |
| `avgLoad` | number | OS load average |
| `currentLoad` | number | Total CPU load percentage |
| `currentLoadUser` | number | User CPU load percentage |
| `currentLoadSystem` | number | System CPU load percentage |
| `currentLoadNice` | number | Nice CPU load percentage |
| `currentLoadIdle` | number | Idle CPU percentage |
| `currentLoadIrq` | number | IRQ CPU load percentage |
| `currentLoadSteal` | number | Steal CPU load percentage |
| `currentLoadGuest` | number | Guest CPU load percentage |
| `rawCurrentLoad` | number | Total raw CPU ticks |
| `rawCurrentLoadUser` | number | Raw user CPU ticks |
| `rawCurrentLoadSystem` | number | Raw system CPU ticks |
| `rawCurrentLoadNice` | number | Raw nice CPU ticks |
| `rawCurrentLoadIdle` | number | Raw idle CPU ticks |
| `rawCurrentLoadIrq` | number | Raw IRQ CPU ticks |
| `rawCurrentLoadSteal` | number | Raw steal CPU ticks |
| `rawCurrentLoadGuest` | number | Raw guest CPU ticks |
| `cpus` | CurrentLoadCpuData[] | Per-core load objects |

Each `CurrentLoadCpuData` entry includes `load`, `loadUser`, `loadSystem`,
`loadNice`, `loadIdle`, `loadIrq`, `loadSteal`, `loadGuest`, `rawLoad`,
`rawLoadUser`, `rawLoadSystem`, `rawLoadNice`, `rawLoadIdle`, `rawLoadIrq`,
`rawLoadSteal`, and `rawLoadGuest`.
