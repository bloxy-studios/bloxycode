# BloxyCode Agent Guidelines

## Build/Test Commands

- **Install**: `bun install`
- **Run**: `bun dev`
- **Typecheck**: `bun run typecheck`
- **Test**: `bun test` (runs all tests)
- **Single test**: `bun test test/tool/tool.test.ts` (specific test file)
- **Build**: `bun run build`

## Code Style

- **Runtime**: Bun with TypeScript ESM modules
- **Imports**: Use relative imports for local modules, named imports preferred
- **Types**: Zod schemas for validation, TypeScript interfaces for structure
- **Naming**: camelCase for variables/functions, PascalCase for classes/namespaces
- **Error handling**: Use Result patterns, avoid throwing exceptions in tools
- **File structure**: Namespace-based organization (e.g., `Tool.define()`, `Session.create()`)

## Architecture

- **Tools**: Implement `Tool.Info` interface with `execute()` method
- **Context**: Pass `sessionID` in tool context, use `App.provide()` for DI
- **Validation**: All inputs validated with Zod schemas
- **Logging**: Use `Log.create({ service: "name" })` pattern
- **Storage**: Use `Storage` namespace for persistence

## Key Modules

- `src/cli/` - CLI commands and TUI interface
- `src/tool/` - AI tool implementations
- `src/session/` - Session management
- `src/agent/` - Agent system (build, plan, bloxy)
- `src/bloxy/` - Autonomous task execution
- `src/provider/` - LLM provider integrations
- `src/server/` - HTTP server
- `src/mcp/` - Model Context Protocol support

## Bloxy Mode

BloxyCode includes Bloxy - an autonomous task execution system:
- Parse PRD files with markdown checkboxes
- Execute tasks sequentially with auto-retry
- Run tests after each task (if configured)
- Auto-commit changes (optional)
- State persisted in `.bloxycode/bloxy-state.json`
