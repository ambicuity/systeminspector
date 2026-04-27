---
description: "Complete SystemInspector documentation and API reference for Memory. Retrieve detailed hardware and system telemetry in Node.js."
---

# Memory Information

Retrieve detailed system memory (RAM) and Swap usage statistics.

## `si.mem()`

Returns a Promise with a memory data object. All values are in bytes.

```javascript
const si = require('@ambicuity/systeminspector');

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
| `reclaimable` | number | Reclaimable memory |
| `buffcache` | number | Buffers + Cache |
| `swaptotal` | number | Total swap size |
| `swapused` | number | Used swap |
| `swapfree` | number | Free swap |
| `writeback` | number \| null | Writeback memory when exposed by the OS |
| `dirty` | number \| null | Dirty memory pages when exposed by the OS |

## Memory Layout

Retrieve detailed physical memory module layout.

## `si.memLayout()`

Returns a Promise with an array of memory stick objects.

```javascript
si.memLayout()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Memory Layout Object

| Property | Type | Description |
| --- | --- | --- |
| `size` | number | Module size in bytes |
| `bank` | string | Memory bank identifier |
| `type` | string | Memory technology/type |
| `ecc` | boolean \| null | ECC support when reported |
| `clockSpeed` | number \| null | Module clock speed in MHz |
| `formFactor` | string | Module form factor |
| `manufacturer` | string | Module manufacturer |
| `partNum` | string | Module part number |
| `serialNum` | string | Module serial number |
| `voltageConfigured` | number \| null | Configured voltage |
| `voltageMin` | number \| null | Minimum voltage |
| `voltageMax` | number \| null | Maximum voltage |
