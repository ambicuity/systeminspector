# SystemInspector

> Lightweight, zero-dependency system and OS inspection library for Node.js.

[![npm version](https://img.shields.io/npm/v/%40ambicuity%2Fsysteminspector.svg)](https://www.npmjs.com/package/@ambicuity/systeminspector)
[![npm downloads](https://img.shields.io/npm/dm/%40ambicuity%2Fsysteminspector.svg)](https://www.npmjs.com/package/@ambicuity/systeminspector)
[![GitHub issues](https://img.shields.io/github/issues/ambicuity/systeminspector.svg)](https://github.com/ambicuity/systeminspector/issues)
[![GitHub closed issues](https://img.shields.io/github/issues-closed/ambicuity/systeminspector.svg)](https://github.com/ambicuity/systeminspector/issues?q=is%3Aissue+is%3Aclosed)
[![license](https://img.shields.io/npm/l/%40ambicuity%2Fsysteminspector.svg)](https://github.com/ambicuity/systeminspector/blob/main/LICENSE)
[![CI](https://github.com/ambicuity/systeminspector/actions/workflows/ci.yml/badge.svg)](https://github.com/ambicuity/systeminspector/actions/workflows/ci.yml)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@ambicuity/systeminspector)
[![Buy Me a Coffee](https://img.shields.io/badge/sponsor-Buy%20Me%20a%20Coffee-orange.svg)](https://buymeacoffee.com/ritesh.rana)

---

## What It Does

SystemInspector provides **58+ asynchronous functions** for retrieving hardware, operating system, runtime, storage, network, process, service, and peripheral information. It is written in strict TypeScript, compiles to CommonJS, and has **zero npm runtime dependencies**.

Supported platforms: **Linux**, **macOS**, **Windows**, **FreeBSD**, **OpenBSD**, **NetBSD**, **SunOS**, **Android**.

---

## Installation

```bash
npm install @ambicuity/systeminspector
```

Requires **Node.js ≥ 18.0.0**.

---

## Quick Start

### CommonJS

```js
const si = require('@ambicuity/systeminspector');

async function main() {
  const cpu = await si.cpu();
  console.log(cpu);

  const os = await si.osInfo();
  console.log(os);
}

main();
```

### Callback Style

```js
const si = require('@ambicuity/systeminspector');

si.cpu((data) => {
  console.log(data);
});
```

---

## CLI

SystemInspector includes a CLI for quick terminal inspection.

```bash
# Readable system report
npx @ambicuity/systeminspector info

# Full static data as JSON (useful for scripts and pipes)
npx @ambicuity/systeminspector

# Help
npx @ambicuity/systeminspector --help
```

---

## API Reference

All functions (except `version()` and `time()`) return Promises and accept an optional callback.

### General

| Function | Returns | Description |
|---|---|---|
| `version()` | `string` | Library version |
| `time()` | `TimeData` | Current time, uptime, timezone |

### System Hardware

| Function | Returns |
|---|---|
| `system()` | `SystemData` |
| `bios()` | `BiosData` |
| `baseboard()` | `BaseboardData` |
| `chassis()` | `ChassisData` |

### CPU & Load

| Function | Returns |
|---|---|
| `cpu()` | `CpuData` |
| `cpuFlags()` | `string` |
| `cpuCache()` | `CpuCacheData` |
| `cpuCurrentSpeed()` | `CpuCurrentSpeedData` |
| `cpuTemperature()` | `CpuTemperatureData` |
| `currentLoad()` | `CurrentLoadData` |
| `fullLoad()` | `number` |

### Memory & Battery

| Function | Returns |
|---|---|
| `mem()` | `MemData` |
| `memLayout()` | `MemLayoutData[]` |
| `battery()` | `BatteryData` |

### Graphics & Peripherals

| Function | Returns |
|---|---|
| `graphics()` | `GraphicsData` |
| `usb()` | `UsbData[]` |
| `printer()` | `PrinterData[]` |
| `audio()` | `AudioData[]` |
| `bluetoothDevices()` | `BluetoothDeviceData[]` |

### Operating System

| Function | Returns |
|---|---|
| `osInfo()` | `OsData` |
| `versions()` | `VersionData` |
| `shell()` | `string` |
| `uuid()` | `UuidData` |
| `users()` | `UserData[]` |

### File System & Disks

| Function | Returns |
|---|---|
| `fsSize()` | `FsSizeData[]` |
| `fsOpenFiles()` | `FsOpenFilesData` |
| `blockDevices()` | `BlockDevicesData[]` |
| `fsStats()` | `FsStatsData` |
| `disksIO()` | `DisksIoData` |
| `diskLayout()` | `DiskLayoutData[]` |

### Network & Wi-Fi

| Function | Returns |
|---|---|
| `networkInterfaces()` | `NetworkInterfacesData[]` |
| `networkInterfaceDefault()` | `string` |
| `networkGatewayDefault()` | `string` |
| `networkStats()` | `NetworkStatsData[]` |
| `networkConnections()` | `NetworkConnectionsData[]` |
| `wifiNetworks()` | `WifiNetworkData[]` |
| `wifiInterfaces()` | `WifiInterfaceData[]` |
| `wifiConnections()` | `WifiConnectionData[]` |

### Processes & Services

| Function | Returns |
|---|---|
| `processes()` | `ProcessesData` |
| `processLoad()` | `ProcessesProcessLoadData[]` |
| `services()` | `ServicesData[]` |

### Internet

| Function | Returns |
|---|---|
| `inetChecksite()` | `InetChecksiteData` |
| `inetLatency()` | `number \| null` |

### Docker & VirtualBox

| Function | Returns |
|---|---|
| `dockerInfo()` | `DockerInfoData` |
| `dockerImages()` | `DockerImageData[]` |
| `dockerContainers()` | `DockerContainerData[]` |
| `dockerContainerStats()` | `DockerContainerStatsData[]` |
| `dockerContainerProcesses()` | `DockerContainerProcessData[]` |
| `dockerVolumes()` | `DockerVolumeData[]` |
| `dockerAll()` | `any[]` |
| `vboxInfo()` | `VboxInfoData[]` |

### Aggregate Helpers

| Function | Returns | Description |
|---|---|---|
| `getStaticData()` | `StaticData` | All static hardware/OS data in one call |
| `getDynamicData()` | `DynamicData` | All dynamic/runtime data in one call |
| `getAllData()` | `AllData` | Combined static + dynamic data |
| `get(valueObject)` | `object` | Selective data retrieval with field filtering |
| `observe(valueObject, interval, cb)` | `ObserveHandle` | Periodic observation with change detection |

### Diagnostics

| Function | Returns | Description |
|---|---|---|
| `diagnostics()` | `DiagnosticData[]` | Non-breaking diagnostic records |
| `clearDiagnostics()` | `void` | Clear diagnostic buffer |

```js
await si.diskLayout();
console.log(si.diagnostics()); // check for missing tools, permission issues, etc.
si.clearDiagnostics();
```

---

## Architecture

```
systeminspector/
├── src/                    # TypeScript source (24 modules)
│   ├── index.ts            # Public API — exports all 58+ functions
│   ├── cli.ts              # CLI entry point (bin: systeminspector)
│   ├── types.ts            # Shared type definitions
│   ├── util.ts             # Internal utilities (exec, parsing, caching)
│   ├── cpu.ts              # CPU inspection
│   ├── memory.ts           # Memory inspection
│   ├── osinfo.ts           # OS information
│   ├── network.ts          # Network interfaces and stats
│   ├── filesystem.ts       # Filesystem and disk inspection
│   ├── processes.ts        # Process and service inspection
│   ├── docker.ts           # Docker container inspection
│   ├── graphics.ts         # GPU and display inspection
│   ├── wifi.ts             # Wi-Fi network inspection
│   ├── system.ts           # System/BIOS/baseboard/chassis
│   ├── battery.ts          # Battery status
│   ├── bluetooth.ts        # Bluetooth device discovery
│   ├── audio.ts            # Audio device inspection
│   ├── printer.ts          # Printer inspection
│   ├── usb.ts              # USB device inspection
│   ├── internet.ts         # Internet connectivity checks
│   ├── users.ts            # User session inspection
│   ├── virtualbox.ts       # VirtualBox VM inspection
│   ├── dockerSocket.ts     # Docker socket communication
│   └── bluetoothVendors.ts # Bluetooth vendor OUI database
├── dist/                   # Compiled output (CommonJS + declarations)
├── test/                   # Tests
│   ├── index.test.ts       # Vitest unit tests
│   ├── ci.ts               # CI smoke tests (runs against built dist)
│   ├── test.ts             # Interactive test runner
│   └── si.ts               # Test helper
├── docs/                   # VitePress documentation site
├── scripts/                # Build and verification scripts
├── biome.json              # Biome linter/formatter configuration
├── tsconfig.json           # TypeScript compiler configuration
├── tsconfig.test.json      # TypeScript config for test files
└── vitest.config.ts        # Vitest test configuration
```

---

## Development

### Build

```bash
npm run build
```

Compiles TypeScript from `src/` to `dist/` using `tsc`.

### Typecheck

```bash
npm run typecheck          # source only
npm run typecheck:test     # source + tests
```

### Lint

```bash
npm run lint               # check with Biome
npm run format             # auto-format with Biome
```

### Test

```bash
npm test                   # Vitest unit tests
npm run test:ci            # CI smoke tests (requires built dist)
```

### Verify Release

```bash
npm run verify:release     # full release verification suite
npm run verify:terminal    # terminal API smoke test
```

---

## CI/CD

GitHub Actions workflows:

| Workflow | Trigger | Purpose |
|---|---|---|
| **CI** (`ci.yml`) | Push/PR to `main` | Lint, typecheck, build, test across Ubuntu/macOS/Windows × Node.js 20/22, plus a Node.js 18 packaged runtime smoke test |
| **npm Publish** (`npm-publish.yml`) | GitHub Release | Build, test, publish to the public npm registry with provenance |
| **CodeQL** (`codeql.yml`) | Push/PR + weekly | Security analysis for JavaScript/TypeScript |
| **Deploy Docs** (`deploy.yml`) | Push to `main` | Build and deploy VitePress site to GitHub Pages |

GitHub Pages must be configured with **Source: GitHub Actions** in repository settings before the docs deployment can publish.

---

## Release Process

1. Update version in `package.json`.
2. Update `CHANGELOG.md`.
3. Commit: `git commit -m "chore: prepare vX.Y.Z release"`.
4. Tag: `git tag vX.Y.Z`.
5. Push: `git push origin main && git push origin vX.Y.Z`.
6. Create a GitHub Release from the tag — this triggers npm publish automatically.

For the scoped npm package, publish to the public npm registry. This command pins the registry because some developer machines map the `@ambicuity` scope to GitHub Packages:

```bash
npm publish --access public --provenance --registry=https://registry.npmjs.org/
```

For the forced `v1.0.0` release, verify tag and package availability first:

```bash
git ls-remote --tags origin v1.0.0
npm view @ambicuity/systeminspector version --@ambicuity:registry=https://registry.npmjs.org/
```

### Dependency Audit

The published package has zero runtime dependencies. The documentation toolchain currently inherits a moderate dev-server advisory through VitePress/Vite/esbuild; npm does not provide an automatic fix for the current VitePress line. Do not run the VitePress development server on an untrusted network, and revisit this when VitePress publishes a compatible fixed release.

---

## Notes

`fsStats()`, `disksIO()`, and `networkStats()` calculate per-second values from
the difference between calls. The first call returns `null` for transfer-rate
fields; subsequent calls return rates based on elapsed time.

```js
const si = require('@ambicuity/systeminspector');

setInterval(() => {
  si.networkStats().then((data) => console.log(data));
}, 1000);
```

Some APIs depend on platform tools such as PowerShell, `sensors`, Docker,
VirtualBox, or `smartmontools`. Unsupported values may be returned as `null`,
empty strings, or empty collections.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

---

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

---

## Sponsorship

If SystemInspector is useful to you, consider supporting the project:

<a href="https://buymeacoffee.com/ritesh.rana" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50"></a>

---

## License

[MIT](LICENSE) — Copyright © 2026 Ritesh Rana.

---

## Maintainer

**Ritesh Rana** — [GitHub](https://github.com/ambicuity)
