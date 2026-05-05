---
description: "Strategic product, architecture, security, performance, UX, testing, and roadmap audit for SystemInspector."
---

# Strategic Audit and Roadmap

This audit reviews the current `feature/trust-apis-and-modernization` branch as a Node.js library and CLI product. It treats the current working tree as the source of truth, including uncommitted files, and optimizes recommendations for developer adoption.

## 1. Executive Summary

### Confirmed from code

SystemInspector is a TypeScript-first Node.js package and CLI for collecting host, hardware, operating system, runtime, process, storage, network, Docker, VirtualBox, and peripheral information. The public package entrypoint is `src/index.ts`, the CLI entrypoint is `src/cli.ts`, and the implementation is organized as domain modules under `src/`.

This branch adds a trust layer around the core inspection APIs:

- `src/capabilities.ts` exposes runtime support metadata.
- `src/schema.ts` exposes schema metadata and a schema version.
- `src/redaction.ts` supports privacy-aware output masking.
- `src/parsers.ts` starts fixture-testable parser extraction.
- `src/dockerSocket.ts` now records socket diagnostics and guards large responses.
- `docs/platform-support.md`, `docs/general.md`, and `README.md` document the new trust-facing APIs.

### Inferred from code

The product is best understood as a direct developer-tool competitor to `systeminformation`, with a newer strategic angle: make local system inspection explainable, typed, diagnosable, and safer for automation.

### Assumptions

The primary audience is Node.js backend engineers, platform engineers, DevOps/SRE users, CLI builders, observability-tool authors, and agent/runtime tooling developers who need local host introspection.

### Recommendations

The next release should be framed as a "trusted core APIs" release: complete the trust APIs for the most-used functions, expand parser fixtures, document support guarantees, and keep the runtime dependency-free positioning.

## 2. Repo Architecture Overview

### Confirmed from code

The repository is a CommonJS npm package built from TypeScript. It has no runtime npm dependencies. Development tooling includes TypeScript, Vitest, Biome, VitePress, and GitHub Actions.

```text
Consumer app / CLI
  -> src/index.ts public API facade
  -> domain module
     -> util.ts command/read/PowerShell/Docker support
     -> OS command, system file, socket, or Node built-in API
     -> parser and normalizer
  -> optional redaction, envelope, diagnostics, schema metadata
  -> returned data object
```

The CLI lifecycle is:

```text
systeminspector command
  -> src/cli.ts argument parser
  -> public API call from src/index.ts
  -> formatted report, JSON, doctor output, schema output, watch stream, or interactive terminal
```

Aggregate helpers are orchestrated in `src/index.ts`:

```text
getStaticData()
  -> system, bios, baseboard, chassis, osInfo, uuid, versions, cpu, graphics,
     networkInterfaces, memLayout, diskLayout, audio, bluetooth, usb, printer

getDynamicData()
  -> time, cpuCurrentSpeed, users, processes, currentLoad, mem, inetLatency,
     cpuTemperature, networkConnections, battery, services, fsSize, networkStats,
     wifiNetworks, fsStats, disksIO

getAllData()
  -> getStaticData()
  -> getDynamicData()
  -> merged AllData response
```

### Inferred from code

The architecture is a modular monolith. It does not use MVC, clean architecture, microservices, serverless, or JAMstack patterns for runtime behavior. The docs site is static VitePress, but the product itself is a local SDK and CLI.

### Assumptions

There is intentionally no database, authentication, authorization, persistent backend, request router, background queue, billing subsystem, or multi-tenant model.

### Recommendations

Keep the monolithic library architecture. It is appropriate for a zero-dependency inspection SDK. The main architecture improvement should be a stronger internal command and parser contract, not a service split.

## 3. Codebase Deep Dive

### Confirmed from code

| Area | Purpose | Design quality | Risk if it fails |
|---|---|---:|---|
| `src/index.ts` | Public API facade, aggregate helpers, `get`, `observe`, `watch`, trust wrappers | Medium | Public API inconsistency or broken package behavior |
| `src/util.ts` | Shared command execution, diagnostics, PowerShell, parsing helpers, sanitization | High-risk core | Cross-platform failures, hangs, security issues, poor diagnostics |
| `src/capabilities.ts` | Runtime capability records and tool detection | Good early foundation | Users cannot explain missing or partial data |
| `src/schema.ts` | Schema metadata | Incomplete | Schema promise appears weaker than docs imply |
| `src/redaction.ts` | Sensitive data masking | Useful foundation | Privacy leaks in reports and support bundles |
| `src/cli.ts` | CLI commands and terminal output | Strong UX foundation | Poor first impression and automation friction |
| `src/interactive.ts` | Interactive terminal inspector | Strong adoption feature | Manual debugging becomes harder |
| `src/dockerSocket.ts` | Docker socket HTTP/JSON client | Medium risk | Docker APIs return empty data or diagnostics under socket failures |
| `src/cpu.ts` | CPU, load, speed, flags, cache, temperature | High complexity | Incorrect hardware data or slow/hung commands |
| `src/network.ts` | Interfaces, stats, connections, gateway/defaults | High complexity | Incorrect network identity, stats, or privacy leakage |
| `src/filesystem.ts` | FS size, disk layout, stats, SMART data | High complexity | Slow scans, parse failures, privileged-command gaps |
| `src/processes.ts` | Processes, services, process load | High complexity | Expensive scans, process parsing errors, command injection risk |
| `docs/` | VitePress reference and support docs | Improving | Adoption loss from unclear support or stale docs |
| `test/` | Vitest tests and fixtures | Thin but improving | Regressions across OS command variants |
| `.github/workflows/` | CI, CodeQL, dependency review, publish, docs deploy | Solid foundation | Release confidence drops |

### Inferred from code

The codebase has inherited parser-heavy logic from a mature system-inspection style library, then modernized toward TypeScript and trust APIs. The core risk is not feature breadth; it is ensuring breadth remains reliable across operating systems.

### Assumptions

The repo should preserve compatibility with callback and Promise styles while adding modern options.

### Recommendations

Prioritize these technical issues:

| Severity | Location | Problem | Recommended fix | Effort | Risk if ignored |
|---|---|---|---|---:|---|
| High | `src/index.ts` | Options and envelope mode are not consistently available across public APIs | Add standardized wrappers for top APIs first | Medium | Confusing adoption experience |
| High | `src/util.ts`, domain modules | Mixed `exec`, `execSync`, `spawn`, and PowerShell patterns | Introduce a typed command contract and migrate high-risk paths | High | Hangs, inconsistent diagnostics, security edge cases |
| High | `src/network.ts`, `src/filesystem.ts`, `src/processes.ts`, `src/cpu.ts` | Large parser modules with limited fixtures | Extract parser units and add OS/tool fixtures | High | Cross-platform regressions |
| Medium | `src/schema.ts` | Schema coverage is shallow | Expand schemas for public return types | Medium | Trust API feels incomplete |
| Medium | `src/index.ts` `get()` | String selector grammar is hard to validate and type | Add typed selector builder while preserving legacy strings | Medium | Edge-case bugs and weak DX |
| Medium | repo-wide | Lint output has hundreds of warnings | Burn down in batches with CI budget | Medium | Contributor confidence drops |

## 4. Product Category and Positioning

### Confirmed from code

SystemInspector is distributed as an npm package with a CLI binary. It retrieves machine-local system information and exposes async APIs with callback compatibility.

### Inferred from code

The product category is local system telemetry SDK and diagnostic CLI for Node.js. It solves "what is this machine and what is happening on it?" for developers and tools.

### Assumptions

The strongest adoption path is OSS credibility: accurate results, clear support boundaries, strong docs, predictable contracts, and low dependency risk.

### Recommendations

Positioning statement:

```text
SystemInspector is a Node.js system telemetry SDK and CLI for platform engineers and tool builders that helps them collect high-fidelity host diagnostics across operating systems by combining native OS inspection with typed, trust-aware APIs.
```

Current maturity is early production-grade OSS. It is not enterprise-ready as a platform, but it can become enterprise-friendly as a dependency with stronger security, schema, and compatibility guarantees.

## 5. Competitor Landscape

### Confirmed from code

The repository overlaps most directly with libraries that expose host/system information to Node.js consumers, plus observability tooling that collects host metrics.

### Inferred from code

| Group | Competitors | Strengths | What SystemInspector lacks |
|---|---|---|---|
| Direct OSS libraries | `systeminformation`, `node-os-utils` | Existing adoption, familiar APIs, broad host coverage | Ecosystem proof, larger fixture history, maturity signals |
| Indirect OSS tooling | Prometheus `node_exporter`, OpenTelemetry Collector host metrics | Production telemetry pipelines and monitoring integrations | SDK-native local object model, zero-dependency npm ergonomics |
| Enterprise observability | Datadog, New Relic, Dynatrace, Grafana Cloud | Dashboards, alerting, fleet views, compliance stories, support | SaaS features are out of scope, but trust and integration expectations matter |
| Emerging alternatives | OTel-native and agentic diagnostics tooling | Standardized pipelines and automation workflows | First-class OTel bridge and AI-assisted diagnostics |

### Assumptions

For developer adoption, the relevant competition is not only feature count. It is confidence: "Will this API work on my platform, explain failures, and avoid surprising my users?"

### Recommendations

Do not compete with enterprise observability products as a SaaS. Compete as a lightweight local engine that can feed those ecosystems.

## 6. Competitor Feature Matrix

| Feature | This repo currently has it? | Competitor examples | Importance | User value | Difficulty | Priority |
|---|---|---|---:|---|---:|---:|
| Broad host telemetry | Yes | `systeminformation` | High | One package for many facts | Low | P0 |
| Zero runtime dependencies | Yes | Some OSS libraries | High | Lower supply-chain risk | Low | P0 |
| CLI inspection | Yes | `systeminformation`, enterprise agents | High | Fast debugging | Low | P0 |
| Runtime capability metadata | Partial | Rare in direct OSS | High | Explains support before collection | Medium | P0 |
| Diagnostics API | Partial | Enterprise agents | High | Debuggable failures | Medium | P0 |
| Redaction | Partial | Enterprise tools | High | Safer issue reports | Medium | P0 |
| Versioned schemas | Partial | Enterprise APIs | High | Automation confidence | Medium | P0 |
| Parser fixture coverage | Partial | Mature OSS projects | High | Cross-platform reliability | Medium | P0 |
| OpenTelemetry bridge | No | OTel Collector | Medium | Easy pipeline integration | Medium | P1 |
| Typed selector builder | No | Modern SDKs | Medium | Better TypeScript DX | Medium | P1 |
| Policy modes | No | Enterprise agents | Medium | Tunable safety/performance | Medium | P1 |
| Fleet monitoring | No | Datadog, New Relic, Dynatrace | Low for SDK | Not the core product | High | P3 |
| Billing/admin/RBAC | No | SaaS observability | Low for SDK | Not needed for OSS library | High | P3 |

## 7. Missing Features and Gaps

### Confirmed from code

Trust APIs exist, but they are not yet applied uniformly across the full public surface. Fixture extraction has started with `parseLscpu`, but most parsing remains embedded in large modules.

### Inferred from code

The biggest parity gap versus mature alternatives is not API breadth. It is proven, repeatable reliability across platforms and clearer support semantics.

### Assumptions

Maintaining zero runtime dependencies remains a product constraint.

### Recommendations

#### Must-have for parity

Feature: Full trust API coverage for high-use APIs  
Why it matters: Developers need consistent timeout, signal, redaction, envelope, and diagnostics behavior.  
Competitors that have it: Enterprise agents expose explainable health/status surfaces; direct OSS competitors have maturity by usage.  
Current repo gap: `cpu` and `getAllData` are ahead of many other APIs.  
User stories: "As a CLI author, I can call any common API with a timeout and receive diagnostics."  
Technical approach: Add a wrapper helper in `src/index.ts`, then migrate top APIs by domain.  
Affected files: `src/index.ts`, `src/types.ts`, `docs/general.md`, tests.  
Testing plan: Contract tests for timeout, envelope, redaction, callback parity.  
Estimated effort: Medium.  
Priority: P0.

Feature: Parser fixture expansion  
Why it matters: OS command output differs by distro, version, locale, and hardware.  
Competitors that have it: Mature OSS projects rely on long real-world fixture history.  
Current repo gap: Only a small parser fixture foundation exists.  
User stories: "As a maintainer, I can add a Linux command fixture and lock expected parsing."  
Technical approach: Extract parser functions gradually and add fixtures by OS/tool.  
Affected files: `src/parsers.ts`, domain modules, `test/fixtures/**`.  
Testing plan: Fixture tests for CPU, filesystem, network, processes, Docker.  
Estimated effort: High.  
Priority: P0.

Feature: Complete schema catalog  
Why it matters: Schema metadata only creates trust if it covers real outputs.  
Current repo gap: `src/schema.ts` covers a small subset.  
Technical approach: Expand schemas for top public return types, then generate or snapshot them.  
Estimated effort: Medium.  
Priority: P0.

#### Should-have for differentiation

Feature: Typed selector builder for `get()`  
Why it matters: The current string selector grammar is powerful but hard to discover and validate.  
Technical approach: Add a builder API while preserving current `get(valueObject)` behavior.  
Estimated effort: Medium.  
Priority: P1.

Feature: OpenTelemetry bridge example  
Why it matters: OTel is a natural path into observability stacks without becoming a SaaS.  
Technical approach: Add docs and examples that map selected data to OTel metric/log payloads.  
Estimated effort: Medium.  
Priority: P1.

#### Enterprise-grade features

Feature: Hardened mode  
Why it matters: Enterprises need predictable command execution behavior and lower data exposure.  
Technical approach: Add strict mode defaults for command execution, redaction, and disabled risky probes.  
Estimated effort: High.  
Priority: P2.

#### AI-native features

Feature: Diagnostic explanation helper  
Why it matters: Missing tools and permission issues are common and frustrating.  
Technical approach: Map diagnostics to natural-language remediation text and safe support bundles.  
Estimated effort: Medium.  
Priority: P2.

#### Developer-experience features

Feature: Docs generated from API/type metadata  
Why it matters: Docs drift is adoption friction.  
Technical approach: Extend `scripts/verify-website.ts` and optionally generate support tables from capability metadata.  
Estimated effort: Medium.  
Priority: P1.

## 8. Priority Roadmap

### Phase 1: Stabilize the foundation

Goals: Improve reliability, reduce contributor friction, and make trust APIs credible.  
Features: Command abstraction, parser fixtures, schema expansion, lint debt burn-down.  
Engineering tasks: Wrap high-use APIs with options, extract parsers, add fixtures, stabilize diagnostics.  
Risks: Refactoring command-heavy code can cause platform regressions.  
Dependencies: CI matrix, fixture collection, maintainer access to representative systems.  
Success metrics: Passing docs build, lower lint warnings, more parser tests, fewer "empty result" issues.  
Complexity: Medium to high.

### Phase 2: Reach competitor parity

Goals: Make SystemInspector feel as safe and mature as broader incumbents.  
Features: Full high-use trust coverage, stable schema policy, support matrix automation.  
Engineering tasks: Apply options/envelopes to top APIs, snapshot schemas, document compatibility guarantees.  
Risks: Public API overload complexity.  
Dependencies: Type contract cleanup.  
Success metrics: More complete API docs, fewer ambiguous support reports.  
Complexity: Medium.

### Phase 3: Differentiate

Goals: Turn trust metadata into the product wedge.  
Features: Capability confidence model, typed selector builder, OTel bridge, better doctor remediation.  
Engineering tasks: Add confidence fields and remediation maps, create examples, improve CLI JSON output.  
Risks: Adding too many surface areas before core APIs stabilize.  
Dependencies: Phase 1 command and schema work.  
Success metrics: Integrations, examples used in issues, lower onboarding confusion.  
Complexity: Medium.

### Phase 4: Enterprise readiness

Goals: Make the package comfortable for larger teams to adopt.  
Features: Hardened mode, SBOM/provenance guidance, security policy expansion, privacy-safe report bundles.  
Engineering tasks: Strict execution profiles, supply-chain docs, support-report generator.  
Risks: Enterprise features could overcomplicate the lightweight product.  
Dependencies: Stable diagnostics and redaction.  
Success metrics: Enterprise security review pass rate, reduced support round trips.  
Complexity: High.

## 9. Technical Implementation Plan

### Confirmed from code

The public API facade is already the correct place to unify options and envelopes. Diagnostics are centralized in `src/util.ts`. The CLI already has command branches for `doctor`, `capabilities`, `schema`, and `watch`.

### Inferred from code

Most improvements can be incremental. A rewrite is not necessary.

### Assumptions

Compatibility with existing callbacks, Promise calls, and return shapes must be preserved.

### Recommendations

Implementation blueprint:

```ts
interface CommandSpec<T> {
  feature: string;
  command: string;
  args?: string[];
  timeoutMs?: number;
  parse: (stdout: string) => T;
}
```

Use this pattern first for new or extracted code, then gradually migrate legacy call sites. Keep legacy behavior where parser output is not yet covered by fixtures.

For public APIs:

```text
public function
  -> normalize callback/options
  -> run domain task
  -> apply timeout/signal if supported
  -> redact if requested
  -> envelope if requested
  -> callback and/or Promise result
```

For schemas:

```text
types.ts public return interface
  -> schema catalog entry
  -> schema snapshot test
  -> docs reference
```

Rollout should start with `cpu`, `mem`, `osInfo`, `fsSize`, `networkInterfaces`, `processes`, `diskLayout`, `graphics`, `dockerAll`, `getStaticData`, `getDynamicData`, and `getAllData`.

## 10. Security Review

### Confirmed from code

The project executes many OS commands and reads sensitive system data. It includes sanitization, diagnostics, timeouts, redaction, GitHub dependency review, CodeQL, and a security policy.

### Inferred from code

The strongest security posture is not "no sensitive data." The product necessarily inspects sensitive local data. The posture should be "clear data classes, safe defaults for sharing, and command execution discipline."

### Assumptions

The package runs with the privileges of the calling process and should not attempt privilege escalation.

### Recommendations

| Severity | Risk | Attack or failure scenario | Affected area | Fix | Tests |
|---|---|---|---|---|---|
| High | Command interpolation edge cases | User-provided selector or filter reaches shell command unexpectedly | Domain modules | Prefer `execFile`/args; add strict command mode | Injection fixture tests |
| Medium | Sensitive output leakage | User pastes CLI output with serials, MACs, IPs, usernames | CLI/API outputs | Promote `--redact`, add support bundle command | Redaction tests |
| Medium | Docker socket exposure | Local Docker socket returns sensitive container metadata | Docker APIs | Document sensitivity, redact paths/env-like fields where feasible | Docker redaction tests |
| Medium | Privileged command ambiguity | `dmidecode`, SMART, sensors fail silently or return partial data | System/filesystem/CPU | Better diagnostics and support hints | Permission diagnostics tests |
| Low | Dependency advisories in docs tooling | VitePress dev dependency advisory affects docs dev server | Docs tooling | Keep security note and avoid exposing dev server | Dependency review |

For SOC 2 readiness as a dependency, add documented secure release process, provenance, SBOM, vulnerability response SLA, data classification, and privacy-safe diagnostics.

## 11. Performance Review

### Confirmed from code

The heaviest paths are OS commands, PowerShell, process scans, network scans, filesystem scans, Docker socket calls, and aggregate helpers that fan out many functions.

### Inferred from code

`getAllData()` is convenient but can be expensive. `watch()` and `observe()` can become costly when polling broad selectors or serializing large payloads.

### Assumptions

The package should favor correctness and bounded execution over maximum throughput by default.

### Recommendations

| Issue | Optimization | Tradeoff | Expected impact | Measurement |
|---|---|---|---|---|
| Heavy aggregate calls | Add timing in envelopes and docs guidance | Slight metadata overhead | Better user decisions | p95/p99 per API |
| Repeated tool probes | Cache capability checks with TTL | Stale after install until refresh | Faster doctor/capabilities | capability latency |
| Large process/network lists | Add optional limits/filters where compatible | More API options | Lower memory and latency | payload size, duration |
| Polling diff cost | Add shallow hash or changed-key strategy | More implementation complexity | Lower CPU in watch loops | watch CPU overhead |
| Command timeouts | Standardize timeout defaults | Some slow systems need override | Fewer hangs | timeout rate |

Suggested metrics: p95 latency, p99 latency, error rate, timeout rate, command duration, payload size, diagnostics count by function, cache hit rate.

## 12. UX Review

### Confirmed from code

The CLI has readable reports, `doctor`, `capabilities`, schema output, `get`, `watch`, and an interactive terminal inspector. The docs have broad reference pages and a platform support page.

### Inferred from code

First-time users will judge the product by whether the first command returns meaningful data and whether unsupported features are explained.

### Assumptions

Most users discover the package through npm, README, or docs search.

### Recommendations

Priority UX improvements:

- Add a "trusted quickstart" flow: install, run `doctor`, call `capability`, call one API with envelope, use `--redact`.
- Make support status visible from docs pages for each API family.
- Make `doctor` output include next-step fixes, not only missing tools.
- Add empty-state language for unsupported/null results.
- Add examples for automation users: JSON output, redacted reports, schema metadata, and watch streams.

## 13. Testing Plan

### Confirmed from code

Vitest tests and typecheck pass. Parser fixtures have started with Linux `lscpu`. CI covers Ubuntu, macOS, Windows, Node 20 and 22, plus package smoke testing on Node 18.

### Inferred from code

Test depth is much smaller than implementation complexity.

### Assumptions

Fixtures are the safest way to improve confidence without requiring every OS locally.

### Recommendations

First 20 tests to add:

| Name | Purpose | Area covered | Why it matters |
|---|---|---|---|
| `cpu_envelope_consistency` | Verify envelope shape | API trust | Prevents inconsistent contracts |
| `mem_envelope_consistency` | Extend options coverage | API trust | High-use API |
| `networkStats_timeout_behavior` | Timeout handling | Network | Avoid hangs |
| `filesystem_command_timeout_diagnostic` | Diagnostic on command timeout | Filesystem | Debuggability |
| `capabilities_tool_probe_timeout` | Tool probe bounds | Capabilities | Fast doctor |
| `docker_socket_parse_error_diagnostic` | Bad socket body | Docker | Safe failure |
| `docker_socket_large_payload_guard` | Payload cap | Docker | Memory safety |
| `get_selector_invalid_syntax_handling` | Selector edge case | `get()` | Predictable API |
| `get_selector_filter_numeric_match` | Filter semantics | `get()` | Backward compatibility |
| `watch_changedOnly_no_duplicate` | Watch diffing | Watch | Polling reliability |
| `watch_abort_signal_stops_cleanly` | Abort support | Watch | Resource cleanup |
| `redaction_mac_ipv4_uuid` | Redact common identifiers | Privacy | Safer support reports |
| `redaction_process_args_paths` | Redact command/path data | Privacy | Avoid leaking secrets |
| `schema_all_public_types_present` | Schema coverage | Schema | Trust completeness |
| `diagnostics_sinceLastCall_semantics` | Drain behavior | Diagnostics | Stable automation |
| `cli_doctor_json_contract` | JSON output shape | CLI | Automation |
| `cli_get_unknown_key_behavior` | Unknown selector behavior | CLI/API | Better errors |
| `linux_lscpu_fixture_variants` | Linux CPU parsing | Parser | Distro variance |
| `windows_powershell_error_classification` | Windows diagnostic mapping | PowerShell | Better Windows support |
| `network_default_interface_fallback_order` | Interface selection | Network | Correct defaults |

## 14. Final Recommendations

### Confirmed from code

SystemInspector already has strong foundations: broad API coverage, zero runtime dependencies, TypeScript, CLI, docs, CI, and a useful trust API direction.

### Inferred from code

The project can become best-in-class for developer adoption if it owns reliability transparency rather than only feature breadth.

### Assumptions

The next milestone should improve adoption confidence without destabilizing the public API.

### Recommendations

Top 10 improvements:

1. Standardize options and envelope support across high-use APIs.
2. Expand schema coverage for all major public return types.
3. Create a typed command abstraction and migrate risky command paths gradually.
4. Add parser fixtures for CPU, filesystem, network, processes, Docker, and Windows PowerShell.
5. Publish stable diagnostic codes and remediation guidance.
6. Promote redaction and safe support-report workflows.
7. Burn down lint debt with a CI warning budget.
8. Add a typed selector builder for `get()`.
9. Add OpenTelemetry bridge examples.
10. Automate docs/support matrix validation from source metadata.

Top competitor-parity features:

- High-confidence cross-platform parser coverage.
- Consistent timeout/signal/redaction/envelope behavior.
- Complete schema metadata.
- Strong CLI doctor guidance.
- Clear compatibility and support policy.

Top differentiation opportunities:

- Capability confidence model.
- Trust-first diagnostics.
- Privacy-safe support bundle.
- Typed selector DSL.
- OTel integration path.

Suggested next engineering milestone: **v1.1 Trusted Core APIs**.

## Prioritized GitHub Issue Backlog

### P0: Standardize InspectOptions and envelope support across top APIs

Description: Apply timeout, signal, redaction, and envelope support consistently to the most-used public functions while preserving existing return shapes by default.

Acceptance criteria:

- At least 15 high-use APIs accept `InspectOptions`.
- Envelope mode has a consistent shape.
- Callback and Promise behavior remain compatible.
- Docs list which APIs support options.

Affected files: `src/index.ts`, `src/types.ts`, `docs/general.md`, `test/index.test.ts`.

Implementation notes: Start with `mem`, `osInfo`, `fsSize`, `networkInterfaces`, `processes`, `diskLayout`, `graphics`, and aggregate helpers.

Priority labels: `P0`, `api`, `developer-experience`, `trust`.

### P0: Expand schema registry for public API return types

Description: Expand `src/schema.ts` from a small hand-authored subset into a broader catalog covering major public return types.

Acceptance criteria:

- Schemas exist for top public return types.
- `schemaVersion()` is documented with compatibility expectations.
- Snapshot tests protect unintentional schema changes.

Affected files: `src/schema.ts`, `src/types.ts`, `docs/general.md`, tests.

Implementation notes: Keep schemas permissive enough for platform-specific fields but precise enough for automation.

Priority labels: `P0`, `schema`, `trust`.

### P0: Add parser fixture coverage for high-risk OS outputs

Description: Extract parser logic and add fixture tests for common command outputs across Linux, macOS, and Windows.

Acceptance criteria:

- Fixtures cover CPU, filesystem, network, processes, and Docker paths.
- Parser tests run without needing platform-specific commands.
- New fixture contribution guidance is documented.

Affected files: `src/parsers.ts`, `test/fixtures/**`, `test/parser-fixtures.test.ts`, domain modules.

Implementation notes: Move one parser at a time to avoid risky broad refactors.

Priority labels: `P0`, `testing`, `cross-platform`, `reliability`.

### P0: Normalize command execution diagnostics

Description: Route new and migrated command paths through a shared command runner that records feature, command, duration, timeout, stderr, and classified issue.

Acceptance criteria:

- Shared command path supports timeout, abort signal, max buffer, and diagnostics.
- At least three high-risk paths migrate.
- Tests cover timeout, missing tool, insufficient privileges, and parse error cases.

Affected files: `src/util.ts`, `src/network.ts`, `src/filesystem.ts`, `src/processes.ts`.

Implementation notes: Preserve legacy behavior until fixtures prove parser compatibility.

Priority labels: `P0`, `security`, `reliability`, `diagnostics`.

### P0: Reduce lint warnings and add warning budget

Description: Reduce repo-wide Biome warnings and prevent regression through a manageable CI budget.

Acceptance criteria:

- Warnings are reduced by at least 80 percent.
- CI reports warning count.
- New warnings fail once budget reaches zero.

Affected files: `src/**`, `test/**`, `.github/workflows/ci.yml`.

Implementation notes: Use safe autofixes first, then manual fixes for correctness warnings.

Priority labels: `P0`, `quality`, `contributor-experience`.

### P1: Improve `doctor` remediation output

Description: Make `systeminspector doctor` explain what is missing, why it matters, and how to fix it.

Acceptance criteria:

- JSON output includes remediation entries.
- Human output includes OS-specific suggested commands or docs links.
- Tests validate the JSON contract.

Affected files: `src/cli.ts`, `src/capabilities.ts`, `docs/platform-support.md`.

Implementation notes: Reuse capability notes and add stable remediation codes.

Priority labels: `P1`, `cli`, `docs`, `trust`.

### P1: Add typed selector builder for `get()`

Description: Provide a typed alternative to the current string selector grammar.

Acceptance criteria:

- Existing `get(valueObject)` behavior remains unchanged.
- New builder can select fields and simple filters with TypeScript help.
- Docs include examples.

Affected files: `src/index.ts`, `src/types.ts`, `docs/general.md`, tests.

Implementation notes: Avoid replacing the legacy string format in the same release.

Priority labels: `P1`, `api`, `typescript`, `developer-experience`.

### P1: Add OpenTelemetry integration example

Description: Show how to map selected SystemInspector outputs into OpenTelemetry metrics or logs.

Acceptance criteria:

- Example covers CPU, memory, filesystem, and network metrics.
- Docs explain when to use SystemInspector vs an OTel Collector hostmetrics receiver.
- Example is runnable or copy-paste clear.

Affected files: `docs/`, `examples/otel/` if examples are added.

Implementation notes: Keep OTel packages out of runtime dependencies.

Priority labels: `P1`, `integrations`, `observability`.

### P2: Add hardened mode

Description: Add a mode for stricter command execution, stronger redaction defaults, and clearer unsupported results.

Acceptance criteria:

- Hardened mode is opt-in.
- Risky probes can be disabled.
- Redaction defaults are documented.

Affected files: `src/types.ts`, `src/index.ts`, `src/util.ts`, docs.

Implementation notes: Make this a policy option rather than a separate API family.

Priority labels: `P2`, `security`, `enterprise`.

### P2: Add privacy-safe support report workflow

Description: Create a recommended workflow for collecting diagnostics and system facts safely for issue reports.

Acceptance criteria:

- CLI supports or documents a redacted support bundle workflow.
- Docs explain exactly what can be sensitive.
- Tests cover redaction of core identifiers.

Affected files: `src/cli.ts`, `src/redaction.ts`, `docs/issues.md`, `docs/general.md`.

Implementation notes: This can start as docs and later become a CLI command.

Priority labels: `P2`, `privacy`, `support`.

## Sources

- `systeminformation`: https://systeminformation.io/
- `systeminformation` GitHub: https://github.com/sebhildebrandt/systeminformation
- `node-os-utils`: https://www.npmjs.com/package/node-os-utils
- Prometheus `node_exporter`: https://github.com/prometheus/node_exporter
- OpenTelemetry Collector receivers: https://opentelemetry.io/docs/collector/components/receiver/
- Datadog pricing: https://www.datadoghq.com/pricing/list/
- New Relic pricing: https://newrelic.com/pricing
- Dynatrace pricing: https://www.dynatrace.com/pricing/
- Grafana pricing: https://grafana.com/pricing/
