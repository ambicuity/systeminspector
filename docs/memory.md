---
description: "Complete SystemInspector documentation and API reference for Memory. Retrieve detailed hardware and system telemetry in Node.js."
---

# Memory Information

Retrieve detailed system memory (RAM) and Swap usage statistics.

## `si.mem()`

Returns a Promise with a memory data object. All values are in bytes.

```javascript
const si = require('systeminspector');

si.mem()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Return Object

| Property | Type | Description |
| --- | --- | --- |
| `total` | number | Total memory in bytes |
| `free` | number | Free memory in bytes |
| `used` | number | Used memory in bytes |
| `active` | number | Active memory |
| `available` | number | Available memory |
| `buffers` | number | Buffers memory |
| `cached` | number | Cached memory |
| `slab` | number | Slab memory |
| `buffcache` | number | Buffers + Cache |
| `swaptotal` | number | Total swap size |
| `swapused` | number | Used swap |
| `swapfree` | number | Free swap |

## Memory Layout

Retrieve detailed physical memory module layout.

## `si.memLayout()`

Returns a Promise with an array of memory stick objects.

```javascript
si.memLayout()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```
