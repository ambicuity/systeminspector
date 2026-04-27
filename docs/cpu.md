---
description: "Complete SystemInspector documentation and API reference for Cpu. Retrieve detailed hardware and system telemetry in Node.js."
---

# CPU Information

Retrieve detailed CPU information including brand, speed, cores, and physical layout.

## `si.cpu()`

Returns a Promise with a detailed CPU data object.

```javascript
const si = require('systeminspector');

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
| `cores` | number | Number of logical cores |
| `physicalCores` | number | Number of physical cores |
| `processors` | number | Number of sockets |
| `socket` | string | Socket type |
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
