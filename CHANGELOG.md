# Changelog

All notable changes to BloxyCode will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
