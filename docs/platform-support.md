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

## Fixture-tested parsers

The matrix above is hand-curated from documented platform capabilities. A subset of code paths is additionally validated by **pure parsers tested against authentic command captures** that ship in `test/fixtures/<platform>/<tool>/`. Those guarantees travel with the package — every PR re-runs them on the CI matrix without needing the source platform present.

| Tool / output | Platform | Parser | Fixture | Used by |
| --- | --- | --- | --- | --- |
| `lscpu` | Linux | `parseLscpu` | `linux/lscpu/ubuntu-22.txt` | `cpu` |
| `df -k` (GNU) | Linux | `parseDf` | `linux/df/sample.txt` | `fsSize` |
| `df -kP` (POSIX) | macOS | `parseDfDarwin` | `darwin/df/df-kP.txt` | `fsSize` ✓ wired |
| `diskutil list` | macOS | `parseDiskutilList` | `darwin/diskutil/list.txt` | `blockDevices` (parser ready, integration pending) |
| `ifconfig <iface>` | macOS / BSD | `parseIfconfigDarwin` | `darwin/ifconfig/{en0,lo0}.txt` | `networkInterfaces` (pending) |
| `route -n get default` | macOS | `parseRouteDarwin` | `darwin/route/default.txt` | `networkGatewayDefault` (pending) |
| `netstat -rn` | macOS | `parseNetstatRoutes` | `darwin/netstat/rn-inet.txt` | network diagnostics |
| `networksetup -listallhardwareports` | macOS | `parseNetworksetupHardwarePorts` | `darwin/networksetup/listallhardwareports.txt` | `networkInterfaces` MAC enrichment |
| `networksetup -getairportnetwork` | macOS | `parseNetworksetupAirportNetwork` | `darwin/networksetup/getairportnetwork-en0.txt` | `wifiConnections` |
| `networksetup -getairportpower` | macOS | `parseNetworksetupAirportPower` | `darwin/networksetup/getairportpower-en0.txt` | `wifiInterfaces` |
| `ps -axo pid,user,pcpu,pmem,command` | macOS | `parsePsAxoDarwin` | `darwin/ps/axo.txt` | `processes` |
| `ps` (4-col GNU) | Linux | `parsePsList` | `linux/ps/sample.txt` | `processes` |
| `system_profiler SPDisplaysDataType` | macOS | `parseSystemProfilerSPDisplays` | `darwin/system_profiler/SPDisplaysDataType.txt` | `graphics` |
| `system_profiler SPMemoryDataType` | macOS | `parseSystemProfilerSPMemory` | `darwin/system_profiler/SPMemoryDataType.txt` | `memLayout` |
| `netstat` | Linux | `parseNetstatConnections` | `linux/netstat/sample.txt` | `networkConnections` |
| `docker ps` | any | `parseDockerPs` | `linux/docker/ps.txt` | `dockerContainers` |

Linux-only and Windows-only parsers are deferred to follow-up branches that capture authentic outputs from those hosts. Contributions of additional fixtures (with PII redaction) are welcome — see the per-domain files under `test/parsers/` for the pattern.
