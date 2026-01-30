# BloxyCode

[![Vibeathon 2026](https://img.shields.io/badge/Vibeathon-Feb%202026-blue?style=for-the-badge)](https://www.bridgemind.ai/vibeathon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.3+-black?style=for-the-badge)](https://bun.sh/)

> **Vibeathon Entry**: This project is a submission for the [BridgeMind Vibeathon](https://www.bridgemind.ai/vibeathon) (Feb 1-14, 2026)
>
> **BloxyCode** is an enhanced fork of [OpenCode](https://github.com/opencode-ai/opencode) featuring **Bloxy** - an autonomous task execution system that runs until your tasks are done.

An AI-powered coding CLI tool that brings the power of Claude and other LLMs directly to your terminal. BloxyCode enables autonomous code generation, intelligent file operations, and seamless AI-assisted development workflows.

## Features

### 🤖 Autonomous Task Execution (Bloxy Mode)
BloxyCode's flagship feature - execute complex coding tasks autonomously from Product Requirements Documents (PRDs):
- **Sequential Task Processing**: Parse PRD markdown files and execute tasks one by one
- **Automatic Testing**: Run tests after each task (when configured)
- **Auto-commit**: Optional automatic git commits with descriptive messages
- **Retry Logic**: Configurable retry attempts for failed tasks
- **Task State Management**: Track pending, in-progress, completed, and failed tasks

### 🛠️ Comprehensive Tool Set
- **File Operations**: Read, write, edit files with intelligent context awareness
- **Code Search**: Fast glob patterns and grep-based content search with ripgrep
- **Bash Integration**: Execute shell commands with proper error handling
- **Web Capabilities**: Web search and content fetching
- **Task Management**: Built-in todo list tracking for complex workflows

### 🎯 Multi-Agent System
Create and manage specialized AI agents for different tasks:
- **Primary Agents**: Main agents for direct interaction
- **Subagents**: Specialized agents for delegated tasks
- **Custom Tools**: Configure which tools each agent can access
- **Agent Generation**: LLM-powered agent creation from descriptions

### 🔌 Extensibility
- **Model Provider Support**: Anthropic, OpenAI, Google, Azure, AWS Bedrock, and 15+ other providers
- **MCP (Model Context Protocol)**: Standard protocol for AI-tool integration
- **Custom Commands**: Define project-specific slash commands
- **Skill System**: Reusable best practices and workflows

### 💬 Multiple Interaction Modes
- **CLI Chat**: Direct command-line interaction with AI
- **Server Mode**: Run as a persistent server with HTTP API
- **TUI (Terminal UI)**: Rich terminal interface built with SolidJS
- **Session Management**: Continue conversations, attach to running servers

### 🔐 Smart Permissions
- **Permission System**: Fine-grained control over tool usage
- **Pattern Matching**: Allow/deny based on file patterns
- **Interactive Prompts**: Ask for permission when needed

## Installation

```bash
# Install via npm (coming soon)
npm install -g @bloxystudios/bloxycode

# Or run directly with bun
bun install
bun run dev
```

## Basic Usage

### Start a conversation

```bash
# Simple prompt
bloxycode run "create a new React component"

# Continue previous session
bloxycode run -c "add tests for the component"

# Use specific model
bloxycode run -m anthropic/claude-sonnet-4 "refactor the authentication logic"

# Attach files to context
bloxycode run -f src/app.ts "review this code for bugs"
```

### Run in Bloxy autonomous mode

Create a `PRD.md` file:

```markdown
# My Feature PRD

## Tasks
- [ ] Create user authentication module
- [ ] Add login and signup endpoints
- [ ] Write unit tests for auth module
```

Then execute:

```bash
bloxycode run "/bloxy PRD.md"
```

BloxyCode will autonomously:
1. Read and parse the PRD
2. Execute each task sequentially
3. Run tests (if configured)
4. Commit changes (if auto-commit enabled)
5. Report progress and results

### Agent Management

```bash
# Create a new custom agent
bloxycode agent create

# List available agents
bloxycode agent list

# Use a specific agent
bloxycode run --agent code-reviewer "review my changes"
```

### Server Mode

```bash
# Start server on specific port
bloxycode serve --port 4096

# Attach to running server
bloxycode run --attach http://localhost:4096 "your prompt"
```

## Configuration

BloxyCode can be configured via:
- `~/.config/bloxycode/config.yml` (global)
- `.bloxycode/config.yml` (project-specific)

Example configuration:

```yaml
# Default model
model: anthropic/claude-sonnet-4

# Share sessions automatically
share: auto

# Custom agents directory
agents: .bloxycode/agent

# Bloxy mode settings
bloxy:
  autoCommit: true
  testCommand: "bun test"
  lintCommand: "bun run typecheck"
  maxRetries: 3
```

## Commands

| Command | Description |
|---------|-------------|
| `run [message]` | Start or continue a conversation |
| `serve` | Start the BloxyCode server |
| `agent create` | Create a new custom agent |
| `agent list` | List all available agents |
| `auth` | Authenticate with providers |
| `models` | List available models |
| `export` | Export session history |
| `import` | Import session history |
| `stats` | View usage statistics |

## Tools Available to AI

BloxyCode provides these tools to AI agents:

- **bash**: Execute shell commands
- **read**: Read file contents
- **write**: Create/overwrite files
- **edit**: Make precise edits to files
- **glob**: Find files by pattern
- **grep**: Search file contents
- **webfetch**: Fetch web content
- **task**: Delegate to subagents
- **todowrite/todoread**: Manage task lists
- **bloxy_control**: Control autonomous execution (Bloxy mode)

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Type check
bun run typecheck

# Run tests
bun test

# Run specific test
bun test test/tool/tool.test.ts

# Build
bun run build
```

## Project Structure

```
src/
├── cli/          # CLI commands and interface
├── tool/         # AI tool implementations
├── session/      # Session management
├── agent/        # Agent system
├── bloxy/        # Autonomous mode implementation
├── provider/     # LLM provider integrations
├── server/       # HTTP server
└── util/         # Utilities
```

## Architecture

BloxyCode uses a modern TypeScript architecture:
- **Runtime**: Bun with TypeScript ESM modules
- **Validation**: Zod schemas for all inputs
- **State**: Namespace-based organization
- **UI**: SolidJS + OpenTUI for terminal interfaces
- **Communication**: MCP (Model Context Protocol) compatible

## Contributing

Contributions are welcome! Please see our contributing guidelines for more details.

## License

MIT

## Links

- [Documentation](https://docs.bloxycode.dev) (coming soon)
- [GitHub](https://github.com/bloxystudios/bloxycode)
- [Discord Community](https://discord.gg/bloxycode) (coming soon)

---

Built with ❤️ by Bloxy Studios
