# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-04-27

### Added

- **58+ async inspection functions** covering system, OS, CPU, memory, storage, network, processes, services, Docker, VirtualBox, USB, printer, audio, Bluetooth, and Wi-Fi.
- **CLI** (`systeminspector info` / `systeminspector`) for terminal-based system reports and JSON output.
- **TypeScript-first** architecture with strict typing, declarations (`.d.ts`), and source maps.
- **Zero runtime dependencies** — uses only Node.js built-in modules.
- **Cross-platform support**: Linux, macOS, Windows, FreeBSD, OpenBSD, NetBSD, SunOS, Android.
- **Diagnostics API** (`diagnostics()`, `clearDiagnostics()`) for non-breaking troubleshooting of missing tools, insufficient privileges, and unsupported hardware.
- **Aggregate helpers**: `getStaticData()`, `getDynamicData()`, `getAllData()`, `get()`, `observe()`.
- **Callback and Promise API** — all async functions support both patterns.
- **CI/CD** with GitHub Actions: matrix testing across Ubuntu, macOS, Windows on Node.js 18, 20, 22.
- **VitePress documentation site** with full API reference.
- **Biome** linter and formatter configuration.
- **Release-ready npm metadata** with strict CommonJS exports, public package contents, MIT license, and Buy Me a Coffee funding metadata.

### Platform Requirements

- Node.js ≥ 18.0.0
- Some APIs depend on platform tools (PowerShell, `sensors`, Docker, `smartmontools`, etc.)

### Changed

- Standardized the documentation site on VitePress and removed the old static HTML documentation, legacy Roboto font bundle, and legacy-only image assets.
- Kept the published npm package lean: only compiled `dist/`, `README.md`, `LICENSE`, and package metadata are included.

[1.0.0]: https://github.com/ambicuity/systeminspector/releases/tag/v1.0.0
