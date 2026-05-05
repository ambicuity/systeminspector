# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

```bash
npm run build           # tsc → dist/ (CommonJS + .d.ts + sourcemaps); postbuild chmods dist/cli.js
npm run typecheck       # type-check src/ only
npm run typecheck:test  # type-check src/ + test/ (uses tsconfig.test.json, noEmit)
npm run lint            # biome lint src/ test/
npm run format          # biome format --write src/ test/
npm test                # vitest run (test/**/*.test.ts, 60s testTimeout)
npm run test:ci         # tsx test/ci.ts — REQUIRES `npm run build` first; the script does require('../dist/index')
npm run docs:dev        # VitePress dev server (do not run on untrusted networks — see README dependency-audit note)
npm run verify:release  # full release verification suite (tsx scripts/verify-release.ts)
```

Run a single Vitest test file: `npx vitest run test/parser-fixtures.test.ts`. Filter by name: `npx vitest run -t "parses Ubuntu lscpu output"`.

Node ≥18 is required (`.nvmrc` pins 18). The Node-18 packaged-runtime smoke job in CI installs the tarball and asserts `si.version()` matches `package.json` — bumping the version requires updating that assertion in `.github/workflows/ci.yml`.

## High-level architecture

**Public surface lives in [src/index.ts](src/index.ts).** It re-exports types and wraps each domain module (`cpu`, `memory`, `osinfo`, `filesystem`, `network`, `processes`, `docker`, etc.) into the documented public API. Adding a new public function means: implement it in a domain module, register a capability entry in [src/capabilities.ts](src/capabilities.ts), add it to `requiredExports` in [scripts/verify-release.ts](scripts/verify-release.ts), and (if it has a stable shape) add a JSON schema in [src/schema.ts](src/schema.ts).

**Dual call style is mandatory.** Every async API accepts an optional callback as its *last* argument *and* returns a Promise. New APIs additionally accept an `InspectOptions` object (`{ timeoutMs, signal, redact, envelope, policy, disableRiskyProbes }`) before the callback. The `wrapInspectFunction` / `withInspectOptions` helpers in [src/index.ts](src/index.ts) handle redaction, timeout, envelope wrapping, and diagnostic capture — use them rather than re-implementing.

**Platform branching uses module-level constants.** [src/util.ts](src/util.ts) exposes `_linux`, `_darwin`, `_windows`, `_freebsd`, `_openbsd`, `_netbsd` derived from `process.platform`. On Windows, `util.getCodepage()` and `util.getPowershell()` are invoked once at import time and a persistent PowerShell child is reused across calls — do not spawn new PowerShell processes per call.

**Diagnostics are non-breaking.** Modules push `DiagnosticRecord`s into a buffer via util helpers when a tool is missing, a command times out, or output cannot be parsed; callers retrieve them via `si.diagnostics()` / `si.onDiagnostic()`. Failures should produce diagnostics + null/empty data rather than thrown errors. The envelope mode includes `diagnostics` recorded *during that single call* (uses `diagnostics().length` snapshot before/after).

**Pure parsers live in [src/parsers.ts](src/parsers.ts) and are fixture-tested.** Anything that parses external command output (lscpu, df, ps, netstat, docker ps) should be a pure function in `parsers.ts` with a fixture under `test/fixtures/<platform>/<tool>/` and a test in [test/parser-fixtures.test.ts](test/parser-fixtures.test.ts). This is how cross-platform parsing is validated on the CI matrix without needing the actual tool present.

**`fsStats`, `disksIO`, and `networkStats` are stateful.** They compute per-second rates from the delta between calls. The first call returns `null` for rate fields; this is intentional, not a bug.

## Hard project constraints

- **Zero runtime dependencies.** `package.json` has only `devDependencies`. Do not add anything to `dependencies` — the value of this package is being dependency-free. The build/test toolchain (Biome, Vitest, tsx, VitePress) stays in dev only.
- **CommonJS output.** `tsconfig.json` targets ES2022 with `module: Node16` but `package.json` declares `"type": "commonjs"` and `exports.require`. New code must be require-compatible after `tsc`. Avoid top-level `await` and ESM-only patterns.
- **Strict TypeScript.** `strict: true` in tsconfig. The codebase uses `any` liberally for parsed shell output (Biome rule `noExplicitAny: off`), but new public types should be precise — see [src/types.ts](src/types.ts).
- **No `Get-WmiObject`.** A test in [test/index.test.ts](test/index.test.ts) asserts `src/battery.ts` and `src/filesystem.ts` do not contain `Get-WmiObject` (deprecated; use `Get-CimInstance` instead).
- **Biome formatting (not Prettier/ESLint):** single quotes, no trailing commas, line width 200, `arrowParentheses: always`. `npm run format` is authoritative.
- **CI lint budget:** the CI job tolerates up to 200 Biome warnings but fails above that — see `.github/workflows/ci.yml`. Don't deliberately add warnings, but don't block work to fix unrelated ones either.

## Release flow

Releases publish via the `npm-publish.yml` workflow when a GitHub Release is created. Manual publish must pin the registry because the `@ambicuity` scope is sometimes mapped to GitHub Packages on contributor machines:

```bash
npm publish --access public --provenance --registry=https://registry.npmjs.org/
```

Bumping the version requires updating: `package.json`, `CHANGELOG.md`, *and* the version assertion in `.github/workflows/ci.yml` (node18-runtime-smoke job).
