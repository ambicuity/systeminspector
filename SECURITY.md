# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Security issues in systeminspector should be reported through
[GitHub Security Advisories](https://github.com/ambicuity/systeminspector/security/advisories/new)
or directly to the maintainer.

Please include enough detail to reproduce and assess the issue:

- Affected version
- Operating system and runtime version
- Impacted API or CLI command
- Reproduction steps
- Expected and actual behavior
- Any known workaround

Reports for third-party tools or operating system commands should be sent to the
maintainers of those projects.

## Disclosure Process

After receiving a report, maintainers will:

1. Confirm the issue and affected versions.
2. Audit related code paths for similar problems.
3. Prepare and test a fix.
4. Release an update as soon as practical.
5. Credit reporters only when they explicitly request attribution.

## Scope

This policy covers the `systeminspector` npm package and its published source
code. It does not cover the documentation website infrastructure or third-party
system tools that the library invokes.

## Pre-release Versions

Alpha, beta, and release-candidate builds are not intended for production use.
Security issues found in pre-release builds should still be reported through the
same process.
