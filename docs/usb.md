---
description: "Complete SystemInspector documentation and API reference for Usb. Retrieve detailed hardware and system telemetry in Node.js."
---

# USB

In this section you will learn how to get information about detected USB devices:

For function reference and examples we assume, that we imported systeminspector as follows:

```
const si = require('systeminspector');
```

## Detected USB Devices

All functions in this section return a promise or can be called with a callback function (parameter cb in the function reference)

| Function | Result object | Linux | BSD | Mac | Win | Sun | Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| si.usb(cb) | \[{...}\] | X |  | X | X |  | array detected USB devices |
|  | \[0\].bus | X |  |  |  |  | USB bus |
|  | \[0\].deviceId | X |  |  |  |  | Bus device ID |
|  | \[0\].id | X |  | X | X |  | ID e.g. 0bda:8821 |
|  | \[0\].name | X |  | X | X |  | name, e.g. root hub |
|  | \[0\].type | X |  | X | X |  | type e.g. keyboard or mouse |
|  | \[0\].removable |  |  | X |  |  | is removable |
|  | \[0\].vendor | X |  | X |  |  | vendor e.g. Realtek |
|  | \[0\].manufacturer | X |  | X | X |  | manufacturer e.g. Chicony |
|  | \[0\].maxPower | X |  |  |  |  | max power e.g. 100mA |
|  | \[0\].serialNumber | X |  | X |  |  | serial number if available |

## Examples

##### Example

```
const si = require('systeminspector');
si.usb().then(data => console.log(data));
```

```json
[
  {
    bus: 1,
    deviceId: 2,
    id: '8087:8001',
    name: '',
    type: 'Hub',
    removable: null,
    vendor: 'Intel Corp.',
    manufacturer: '',
    maxPower: '0mA',
    serialNumber: null
  },
  {
    bus: 1,
    deviceId: 1,
    id: '1d6b:0002',
    name: '2.0 root hub',
    type: 'Hub',
    removable: null,
    vendor: 'Linux Foundation',
    manufacturer: 'Linux 4.4.0-169-generic ehci_hcd',
    maxPower: '0mA',
    serialNumber: null
  },
  {
    bus: 2,
    deviceId: 4,
    id: '04f2:0402',
    name: 'Genius LuxeMate i200 Keyboard',
    type: 'Keyboard',
    removable: null,
    vendor: 'Chicony Electronics Co., Ltd',
    manufacturer: 'Chicony',
    maxPower: '100mA',
    serialNumber: null
  },
  {
    bus: 2,
    deviceId: 3,
    id: '093a:2510',
    name: 'Optical Mouse',
    type: 'Mouse',
    removable: null,
    vendor: 'Pixart Imaging, Inc.',
    manufacturer: 'PIXART',
    maxPower: '100mA',
    serialNumber: null }
]
```

