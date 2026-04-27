---
description: "Complete SystemInspector documentation and API reference for Battery. Retrieve detailed hardware and system telemetry in Node.js."
---

# Battery

In this section you will learn how to get battery information - if supported by system:

For function reference and examples we assume, that we imported systeminspector as follows:

```
const si = require('@ambicuity/systeminspector');
```

## Battery Data

All functions in this section return a promise or can be called with a callback function (parameter cb in the function reference)

| Function | Result object | Linux | BSD | Mac | Win | Sun | Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| si.battery(cb) | {...} | X | X | X | X |  | battery information |
|  | hasBattery | X | X | X | X |  | indicates presence of battery |
|  | cycleCount | X |  | X |  |  | numbers of recharges |
|  | isCharging | X | X | X | X |  | indicates if battery is charging |
|  | designedCapacity | X |  | X | X |  | designed capacity of battery (mWh) |
|  | maxCapacity | X |  | X | X |  | max capacity of battery (mWh) |
|  | currentCapacity | X |  | X | X |  | current capacity of battery (mWh) |
|  | capacityUnit | X |  | X | X |  | capacity unit (mWh if possible) |
|  | voltage | X |  | X | X |  | current voltage of battery (V) |
|  | percent | X | X | X | X |  | charging level in percent |
|  | timeRemaining | X |  | X |  |  | minutes left (if discharging) |
|  | acConnected | X | X | X | X |  | AC connected |
|  | type | X |  | X |  |  | battery type |
|  | model | X |  | X |  |  | model |
|  | manufacturer | X |  | X |  |  | manufacturer |
|  | serial | X |  | X |  |  | battery serial |
|  | additionalBatteries\ |  |  |  | X |  | array of additional batteries |

## Known issues

#### Windows Battery

Windows battery data comes from PowerShell CIM/WMI providers and sometimes needs administrator privileges. If you still do not get values, your system or firmware might not support this feature.

## Examples

##### Example

```
const si = require('@ambicuity/systeminspector');
si.battery().then(data => console.log(data));
```

```json
{
  hasBattery: true,
  cycleCount: 35,
  isCharging: false,
  designedCapacity: 64958,
  maxCapacity: 65865,
  currentCapacity: 64856,
  voltage: 12.767,
  capacityUnit: 'mWh',
  percent: 100,
  timeRemaining: 551,
  acConnected: false,
  type: 'Li-ion',
  model: '',
  manufacturer: 'Apple',
  serial: 'F9Y19860Y9AH9XBAX'
}
```

