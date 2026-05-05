# Platform Support Matrix

SystemInspector exposes capability metadata at runtime:

```js
const si = require('@ambicuity/systeminspector');

console.log(await si.capabilities());
console.log(await si.capability('dockerContainers'));
```

Legend:

| Symbol | Meaning |
|---|---|
| ✅ | Supported with built-in OS APIs or common platform commands |
| ⚠️ | Partial support, hardware-dependent, or requires optional tools/permissions |
| ❌ | Unsupported or not currently implemented |

| Function | Linux | macOS | Windows | FreeBSD/OpenBSD/NetBSD | SunOS | Android |
|---|---:|---:|---:|---:|---:|---:|
| `cpu`, `mem`, `osInfo`, `time`, `currentLoad` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `cpuTemperature` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| `system`, `bios`, `baseboard`, `chassis` | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| `fsSize`, `blockDevices`, `diskLayout` | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| `fsStats`, `disksIO` | ✅ | ✅ | ❌ | ⚠️ | ❌ | ✅ |
| `networkInterfaces`, `networkStats`, `networkConnections` | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| `wifiNetworks`, `wifiInterfaces`, `wifiConnections` | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ |
| `processes`, `processLoad`, `services`, `users` | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| `dockerInfo`, `dockerImages`, `dockerContainers`, `dockerContainerStats`, `dockerContainerProcesses`, `dockerVolumes`, `dockerAll` | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| `vboxInfo` | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| `usb`, `audio`, `bluetoothDevices`, `printer`, `graphics` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

Common optional tools include `dmidecode`, `lscpu`, `sensors`, `smartctl`, `lsblk`, `lspci`, `lsusb`, `nmcli`, `iw`, `iwlist`, `lpstat`, Docker, VirtualBox, PowerShell, `system_profiler`, `ioreg`, and `netsh`.

Use `systeminspector doctor` when opening issues or sharing machine diagnostics. Add `--json` for automation and `info --redact` for privacy-safe reports.
