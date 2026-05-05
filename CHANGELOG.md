# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-05-05

### Added

- **Dual ESM / CJS package.** Modern ESM consumers (Vite, Next, Bun) can `import` the library natively without CJS interop warnings. CommonJS `require()` continues to work unchanged. The `bin` entrypoint stays CJS for shebang simplicity.
- **`@deprecated` JSDoc on v2.0-bound overloads.** Callback-style overloads (e.g. `cpu(callback)`) and positional-arg overloads (`fsSize(drive)`, `networkInterfaces(rescan, defaultString)`) carry IDE strikethrough — no runtime change, no breaking change, signals that the options-object form is the path forward.
- **Per-call diagnostic scope** via `AsyncLocalStorage`. Concurrent envelope-mode calls no longer bleed each other's diagnostic records into their envelopes. `si.diagnostics()` and `onDiagnostic()` listener semantics are unchanged.
- **PowerShell child cleanup** on Windows. Persistent PowerShell process registers `process.on('exit')` / `SIGINT` / `SIGTERM` cleanup hooks on first spawn; quick CLI exits no longer leak the child.
- **Fixture-tested macOS parsers** for `df -kP`, `diskutil list`, `ifconfig`, `route get default`, `netstat -rn`, `networksetup` (hardware ports / airport network / airport power), `ps -axo`, and `system_profiler` (displays, memory). All parsers are pure functions in `src/parsers.ts` with authentic captures under `test/fixtures/darwin/`. See [docs/platform-support.md](docs/platform-support.md#fixture-tested-parsers) for the full table.
- **`fsSize()` macOS path** now consumes `parseDfDarwin` from `src/parsers.ts`. Output shape unchanged; verified via before/after diff of `{fs, type, mount}` tuples on the dev machine.
- **API codegen pipeline.** The 50 wrapped public functions in `src/index.ts` are now generated from `scripts/api-registry.ts` via `scripts/codegen-public-api.ts` → `src/index.generated.ts`. `wrapInspectFunction` / `withInspectOptions` / `normalizeOptions` extracted to `src/wrap.ts`. `npm run codegen:api:check` is a CI gate.
- **Bluetooth SIG vendors codegen.** `src/bluetoothVendors.ts` is now regenerated from the canonical Bluetooth SIG company-identifiers YAML (4019 entries, was hand-maintained at 1136 entries — nearly 3000 newer entries gained). Weekly cron (`.github/workflows/refresh-bluetooth-vendors.yml`) opens a PR if upstream changes; PR-time freshness check is `continue-on-error` so it doesn't block unrelated work.
- **Lint warning ratchet.** `.lint-warning-baseline` (single integer) replaces the 200-warning shell ceiling in CI. The baseline can only ratchet down — every increase fails CI or requires an explicit baseline bump documented in the PR.
- **Concurrency test for diagnostics scope** (`test/diagnostics-concurrency.test.ts`).
- **API shape test** (`test/api-shape.test.ts`) asserting the 69-export public surface has no surprise additions or removals.
- **Windows-only PowerShell cleanup smoke test** (`test/powershell-cleanup.test.ts`).

### Changed

- **`src/index.ts`** shrunk from 708 to ~340 lines; the API surface is now generated, not hand-written.
- **Lint warning baseline** dropped from 200 (previous shell ceiling) to **10** after Biome auto-fixes (`useParseIntRadix`, `noUnusedImports`, `noUnusedFunctionParameters`, etc.).
- **CI** now runs `lint:check` (baseline ratchet), `codegen:api:check`, and `codegen:bluetooth-vendors:check` (soft gate). The Node-18 runtime-smoke job reads the expected version from the tarball filename, so version bumps no longer require editing the workflow YAML.

### Notes

- All changes are fully backward-compatible. No public exports were removed or changed in shape. Every existing callback overload and positional arg keeps working.
- Linux/Windows/BSD parser extraction is intentionally deferred to follow-up branches that capture authentic outputs from those hosts (no fabricated fixtures from man pages).

## [1.0.1] — 2026-04-27

### Added

- Published the interactive terminal inspector as `systeminspector interactive`.

### Changed

- Updated npm homepage metadata to point to the hosted Getting Started documentation.
- Updated README and documentation command examples for the published interactive CLI.

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

[1.1.0]: https://github.com/ambicuity/systeminspector/releases/tag/v1.1.0
[1.0.1]: https://github.com/ambicuity/systeminspector/releases/tag/v1.0.1
[1.0.0]: https://github.com/ambicuity/systeminspector/releases/tag/v1.0.0
