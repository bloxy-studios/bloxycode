# Changelog

All notable changes to BloxyCode will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.15] - 2026-01-31

### Added
- Added fallback AI models for release notes generation

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

## [1.0.2] - 2026-01-30

### Skipped
- Internal testing release.

## [1.0.1] - 2026-01-30

### Fixed
- **ES Module Runtime Error**: Fixed `bin/bloxycode` to use ES module syntax (`import` instead of `require`), resolving the "ReferenceError: require is not defined in ES module scope" error when running globally installed package
- **Peer Dependency Warnings**: Resolved npm peer dependency warnings by:
  - Adding `resolutions` field to force consistent versions across all packages
  - Updated `@hono/standard-validator` from `0.1.5` to `^0.2.0` to match `hono-openapi` requirements
  - Forced `zod@4.1.8` and `quansync@^1.0.0` for all dependencies to eliminate version conflicts

### Changed
- Package now installs cleanly without peer dependency warnings
- Global installation (`npm install -g @bloxystudios/bloxycode`) now works correctly

## [1.0.0] - 2026-01-30

### Added
- **Bloxy Mode**: Autonomous task execution from PRD files
  - Sequential task processing with auto-retry
  - Test validation after each task
  - Auto-commit support
  - Task state persistence in `.bloxycode/bloxy-state.json`
- Multi-provider support (Anthropic, OpenAI, Google, Azure, AWS Bedrock, and more)
- Provider fallback with automatic rate limit handling
- MCP (Model Context Protocol) integration
- Custom agent and skill system
- TUI (Terminal UI) with SolidJS and OpenTUI
- Server mode with HTTP API
- Session management with conversation continuity
- File operations with intelligent context awareness
- Web search and content fetching capabilities

### Changed
- Forked from [OpenCode](https://github.com/opencode-ai/opencode) with BloxyCode branding
- Enhanced provider switching on rate limits with auto-resume

### Notes
- Initial public release for [Vibeathon by BridgeMind](https://www.bridgemind.ai/vibeathon)
- Built with Bun runtime
- MIT Licensed
