# Contributing to SystemInspector

Thank you for considering contributing to SystemInspector. We welcome quality contributions that improve the library.

## Guidelines

- **No runtime dependencies.** This package must remain dependency-free for production installs.
- **Multi-platform.** Test on as many platforms as feasible (Linux, macOS, Windows). Note which platforms you tested against in your PR.
- **Non-breaking.** Avoid breaking changes. If a breaking change is unavoidable, clearly document it in your PR description.
- **Typed.** All new code must be written in strict TypeScript.
- **Tested.** Include or update tests for new functionality.

## Development Setup

```bash
git clone https://github.com/ambicuity/systeminspector.git
cd systeminspector
npm install
npm run build
npm test
```

## Workflow

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes.
4. Ensure all checks pass:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   npm test
   ```
5. Submit a pull request against `main`.

## Reporting Issues

Use the [issue templates](https://github.com/ambicuity/systeminspector/issues/new/choose) to report bugs or request features.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
