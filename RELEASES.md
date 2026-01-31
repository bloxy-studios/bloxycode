# Release Notes

## [1.0.14] - 2026-01-31

### Fixed
- **Bloxy Mode**: Fixed PRD file checkbox not updating when tasks complete, fixed missing task context injection, and fixed autonomous task continuation (republish)

## [1.0.13] - 2026-01-31

### Fixed
- **Bloxy Mode**: Fixed PRD file checkbox not updating when tasks complete, fixed missing task context injection, and fixed autonomous task continuation

## [1.0.9] - 2026-01-30

### Fixed
- **Branding**: Fixed `bloxycode upgrade` and `uninstall` command branding to reference `bloxy-studios` correctly.
- **Docker**: Final adjustments to Docker build paths and GHCR image naming.
- **Homebrew**: Updated Homebrew tap repository references.

## [1.0.8] - 2026-01-30

### Fixed
- **Publishing**: Corrected GitHub organization name to `bloxy-studios` in release scripts.

## [1.0.7] - 2026-01-30

### Fixed
- **Docker**: Updated `COPY` paths in Dockerfile to handle scoped `@bloxystudios` packages correctly.

## [1.0.6] - 2026-01-30

### Added
- **Bloxy Configuration**: New commands for managing Bloxy environment:
  - `/bloxy-init`: Initialize a new session.
  - `/bloxy-config`: Manage configuration settings.
  - `/bloxy-rule`: Manage agent rules.
  - `/bloxy-gh`: GitHub integration tools.
  - `/bloxy-browser`: Browser automation capabilities.

## [1.0.5] - 2026-01-30

### Fixed
- **Archives**: Fixed release archive generation for scoped packages.

## [1.0.4] - 2026-01-30

### Fixed
- **Maintenance**: Minor stability improvements and release script adjustments.

## [1.0.3] - 2026-01-30

### Added
- **Automation**: Added `script/release.ts` and CI workflows for automated releases.

## [1.0.1] - 2026-01-30

### Fixed
- **ES Module Runtime Error**: Fixed `bin/bloxycode` to use ES module syntax.
- **Peer Dependency Warnings**: Resolved npm peer dependency warnings.

## [1.0.0] - 2026-01-30

### Added
- Initial public release for Vibeathon.
- **Bloxy Mode**: Autonomous task execution.
- Multi-provider support.
- MCP integration.
- TUI and Server modes.
