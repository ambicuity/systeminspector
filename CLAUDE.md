# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

```bash
npm run build                   # full build: prebuild + build:cjs + build:esm
                                # prebuild = write-version + codegen:api
                                # build:cjs = tsc -p tsconfig.json     → dist/cjs/
                                # build:esm = tsc -p tsconfig.esm.json → dist/esm/ + finalize-esm.js
npm run typecheck               # type-check src/ only (uses tsconfig.json, --noEmit)
npm run typecheck:test          # type-check src/ + test/ (uses tsconfig.test.json)
npm run lint                    # raw biome lint (errors fail; warnings counted by lint:check)
npm run lint:check              # ratchet check against .lint-warning-baseline (used in CI)
npm run lint:baseline           # update the baseline after fixing warnings (--update mode)
npm run format                  # biome format --write src/ test/
npm test                        # vitest run (test/**/*.test.ts, 60s testTimeout)
npm run test:ci                 # tsx test/ci.ts — REQUIRES `npm run build` first
                                # (script does require('../dist/cjs/index'))
npm run codegen:api             # regenerate src/index.generated.ts from scripts/api-registry.ts
npm run codegen:api:check       # CI gate — fails if generated file is stale
npm run codegen:bluetooth-vendors        # fetch upstream SIG YAML, regenerate src/bluetoothVendors.ts
npm run codegen:bluetooth-vendors:check  # CI soft-gate (continue-on-error in workflow)
npm run docs:dev                # VitePress dev server (do not run on untrusted networks)
npm run verify:release          # full release verification suite
```

Run a single Vitest test file: `npx vitest run test/parsers/filesystem.test.ts`. Filter by name: `npx vitest run -t "parses Ubuntu lscpu output"`.

Node ≥18 is required (`.nvmrc` pins 18). The Node-18 packaged-runtime smoke job in CI installs the tarball and asserts both CJS `require()` and ESM `import` work; the expected version is read from the tarball filename, so version bumps don't require updating the workflow YAML.

## High-level architecture

**Public API is generated, not hand-written.** `src/index.ts` (~340 LOC) is now a thin facade. The 50 wrapped functions (cpu, mem, osInfo, fsSize, networkInterfaces, etc.) are emitted into `src/index.generated.ts` by `scripts/codegen-public-api.ts` from a single registry at `scripts/api-registry.ts`. Adding a new public function = add an entry to the registry, run `npm run codegen:api`, and add it to `requiredExports` in [scripts/verify-release.ts](scripts/verify-release.ts). The codegen freshness check is a CI gate.

The hand-written parts of `src/index.ts` are: `version()`, the diagnostics/schema/capability re-exports, `time`/`battery` (which use a default import), `powerShellStart`/`Release`, and the orchestrators (`getStaticData`, `getDynamicData`, `getAllData`, `get`, `select`, `observe`, `watch`).

**Three wrapper modes in the registry**: `legacy` (callback-only re-export with `as unknown as` cast), `legacy-direct` (callback-only, source already typed), `modern` (three overloads — callback / `InspectOptions` / `InspectEnvelopeOptions` — wired through `wrapInspectFunction`), and `hybrid` (modern overloads + a hand-written positional-arg overload + dispatcher; only `fsSize` and `networkInterfaces` use this).

**Wrapping helpers live in [src/wrap.ts](src/wrap.ts)**: `wrapInspectFunction`, `withInspectOptions`, `normalizeOptions`. The generated file imports from there.

**Diagnostics are scoped per call via AsyncLocalStorage.** [src/util.ts](src/util.ts) exposes a `diagnosticContext` `AsyncLocalStorage<{ records: DiagnosticRecord[] }>`. `wrap.ts` runs each call inside `diagnosticContext.run(scope, ...)`. `pushDiagnostic` dual-writes to both the per-call scope (when active) and the global `_diagnostics` buffer — so envelope mode returns a clean per-call slice while `si.diagnostics()` and `onDiagnostic` listeners keep aggregating globally. Concurrent envelope calls don't bleed into each other.

**Pure parsers live in [src/parsers.ts](src/parsers.ts) and are fixture-tested.** Anything that parses external command output should be a pure function with a typed return shape (`Parsed<Tool>`) and a fixture under `test/fixtures/<platform>/<tool>/`. Tests are split per domain in `test/parsers/{filesystem,network,wifi,process-graphics}.test.ts`. macOS coverage is most complete because authentic captures came from the dev machine; Linux/Windows/BSD are intentionally deferred — don't fabricate fixtures from man pages, capture from real hosts.

**Platform branching uses module-level constants.** [src/util.ts](src/util.ts) exposes `_linux`, `_darwin`, `_windows`, `_freebsd`, `_openbsd`, `_netbsd` derived from `process.platform`. On Windows, `util.getCodepage()` and `util.getPowershell()` are invoked once at import time. The persistent PowerShell child registers `process.on('exit')` / `SIGINT` / `SIGTERM` cleanup hooks on first spawn (idempotent guard) — quick CLI exits no longer leak the child.

**`fsStats`, `disksIO`, `networkStats` are stateful.** Per-second rates from the delta between calls. The first call returns `null` for rate fields — intentional, not a bug.

## Hard project constraints

- **Zero runtime dependencies.** `package.json` has only `devDependencies`. The build/codegen toolchain (Biome, Vitest, tsx, VitePress) stays in dev only. Even the Bluetooth-vendors codegen avoids a YAML library by parsing with regex.
- **Dual CJS/ESM output.** `tsconfig.json` emits CJS into `dist/cjs/`; `tsconfig.esm.json` (module: ES2022, moduleResolution: bundler) emits into `dist/esm/`, then `scripts/finalize-esm.js` writes `dist/esm/package.json` (`{"type":"module"}`) and rewrites bare relative imports to add `.js` extensions for Node ESM resolution. `package.json` exports map exposes both formats; the CLI bin stays CJS for shebang simplicity.
- **Strict TypeScript.** `strict: true`. `any` is tolerated for raw exec stdout but parser inputs/outputs must be typed (`Parsed<Tool>` interfaces in `src/parsers.ts`).
- **No `Get-WmiObject`.** A test in [test/index.test.ts](test/index.test.ts) asserts `src/battery.ts` and `src/filesystem.ts` don't contain it (deprecated; use `Get-CimInstance`).
- **Biome formatting** (not Prettier/ESLint): single quotes, no trailing commas, line width 200, `arrowParentheses: always`. `npm run format` is authoritative.
- **Lint ratchet.** [.lint-warning-baseline](.lint-warning-baseline) is a single integer that can only ratchet down. CI runs `npm run lint:check` which fails on any increase; on a decrease it nudges you to run `npm run lint:baseline`.
- **Codegen freshness gates.** `npm run codegen:api:check` and `codegen:bluetooth-vendors:check` are CI gates. The latter is `continue-on-error` because upstream SIG updates shouldn't block unrelated PRs — the weekly `refresh-bluetooth-vendors.yml` workflow opens a PR instead.

## v2.0 signal

Modern wrappers' callback overloads and the positional `fsSize(drive)` / `networkInterfaces(rescan, defaultString)` overloads carry `@deprecated` JSDoc tags. They still work — IDE strikethrough only — but flag the v2.0 direction. Removal is a breaking change deferred to a v2 branch.

## Release flow

Releases publish via the `npm-publish.yml` workflow when a GitHub Release is created. Manual publish must pin the registry because the `@ambicuity` scope is sometimes mapped to GitHub Packages on contributor machines:

```bash
npm publish --access public --provenance --registry=https://registry.npmjs.org/
```

Bumping the version requires updating: `package.json` and `CHANGELOG.md`. The Node-18 runtime-smoke job reads the expected version from the tarball filename, so the workflow YAML no longer needs editing per release.
