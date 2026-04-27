---
description: "Complete SystemInspector documentation and API reference for System. Retrieve detailed hardware and system telemetry in Node.js."
---

# System (Hardware)

In this section you will learn how to get basic system hardware data. We will cover the system, baseboard and bios:

For function reference and examples we assume, that we imported systeminspector as follows:

```
const si = require('systeminspector');
```

## System

All functions in this section return a promise or can be called with a callback function (parameter cb in the function reference)

| Function | Result object | Linux | BSD | Mac | Win | Sun | Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| si.system(cb) | {...} | X | X | X | X |  | hardware information |
|  | manufacturer | X | X | X | X |  | e.g. 'MSI' or 'DELL' |
|  | model | X | X | X | X |  | model/product e.g. 'MS-7823' |
|  | version | X | X | X | X |  | version e.g. '1.0' |
|  | serial | X | X | X | X |  | serial number |
|  | uuid | X | X | X | X |  | UUID |
|  | sku | X | X | X | X |  | SKU number |
|  | virtual | X | X |  | X |  | is virtual machine |
|  | virtualHost | X | X |  | X |  | virtual host (only if virtual = true) |
|  | raspberry | X |  |  |  |  | Additional Raspberry-specific information  
manufacturer, processor, type, revision  
Raspberry only |
| si.uuid(cb) | {...} | X | X | X | X | X | object of several UUIDs |
|  | os | X | X | X | X |  | os specific UUID |
|  | hardware | X | X | X | X |  | hardware specific UUID |
|  | macs | X | X | X | X |  | MAC addresses |
| si.bios(cb) | {...} | X | X | X | X |  | bios information |
|  | vendor | X | X | X | X |  | e.g. 'AMI' |
|  | version | X | X | X | X |  | version |
|  | releaseDate | X | X |  | X |  | release date |
|  | revision | X | X |  | X |  | revision |
|  | serial | X |  |  | X |  | serial |
|  | language | X |  |  |  |  | bios language |
|  | features | X |  |  |  |  | supported features |
| si.baseboard(cb) | {...} | X | X | X | X |  | baseboard information |
|  | manufacturer | X | X | X | X |  | e.g. 'ASUS' |
|  | model | X | X | X | X |  | model / product name |
|  | version | X | X | X | X |  | version |
|  | serial | X | X | X | X |  | serial number |
|  | assetTag | X | X | X | X |  | asset tag |
|  | memMax | X |  | X | X |  | memory max capacity bytes (where available) |
|  | memSlots |  | X | X | X |  | number memory slots on baseboard |
| si.chassis(cb) | {...} | X | X | X | X |  | chassis information |
|  | manufacturer | X | X | X | X |  | e.g. 'ASUS' |
|  | model | X | X | X | X |  | model / product name |
|  | type | X | X | X | X |  | chassis type e.g. 'desktop' |
|  | version | X | X | X | X |  | version |
|  | serial | X | X | X | X |  | serial number |
|  | assetTag | X | X | X | X |  | asset tag |
|  | sku |  |  | x | X |  | SKU number |

## Examples

##### Example

```
const si = require('systeminspector');
si.system().then(data => console.log(data));
```

```json
{
  manufacturer: 'Apple Inc.',
  model: 'MacBookPro13,2',
  version: '1.0',
  serial: 'C01xxxxxxxx',
  uuid: 'F87654-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  sku: 'Mac-99878xxxx...',
  virtual: false,
}
```

##### Example

```
const si = require('systeminspector');
si.uuid().then(data => console.log(data));
```

```json
{
  os: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  hardware: 'xxxxxxxxxxxxxx',
  macs: [
    '01:02:03:04:05:06',
    '02:03:04:05:06:07',
    'aa:bb:cc:dd:ee:ff'
  ]
}
```

##### Example

```
const si = require('systeminspector');
si.bios().then(data => console.log(data));
```

```json
{
  vendor: 'American Megatrends Inc.',
  version: 'P4.20',
  releaseDate: '2019-09-05',
  revision: '5.13',
  langage: 'en',
  features: [
    'PCI',
    'Boot from CD',
    'Selectable boot',
    'EDD',
    'Print screen service',
    'ACPI',
    'USB legacy',
    'BIOS boot specification',
    'Targeted content distribution',
    'UEFI'
  ]
}
```

##### Example

```
const si = require('systeminspector');
si.baseboard().then(data => console.log(data));
```

```json
{
  manufacturer: 'ASRock',
  model: 'H310M-STX',
  version: '',
  serial: 'C80-xxxxxxxxxxx',
  assetTag: ''
  memMax: 68719476736
  memSlots: 2
}
```

##### Example

```
const si = require('systeminspector');
si.chassis().then(data => console.log(data));
```

```json
{
  manufacturer: 'Apple Inc.',
  model: 'MacBookPro13,2',
  type: 'Laptop',
  version: '1.0',
  serial: 'C01xxxxxxxx',
  assetTag: 'Mac-99878xxxx...',
  sku: 'A1706'
}
```

