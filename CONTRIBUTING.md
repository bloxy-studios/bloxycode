# Contributing to BloxyCode

Thank you for your interest in contributing to BloxyCode! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) 1.3 or higher
- Git

### Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bloxycode.git
   cd bloxycode
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Run in development mode:
   ```bash
   bun dev
   ```

## Development Workflow

### Running Tests
```bash
bun test
```

### Type Checking
```bash
bun run typecheck
```

### Building
```bash
bun run build
```

### Code Style
- Use TypeScript with ESM modules
- Prefer Zod schemas for validation
- Use namespace-based organization (e.g., `Tool.define()`, `Session.create()`)
- Avoid `try/catch`; use `.catch()` patterns
- Prefer `const` over `let`
- Use single-word variable names when possible
- Rely on type inference; avoid explicit types unless needed for exports

## Submitting Changes

### Pull Request Process
1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Run tests: `bun test`
4. Run type check: `bun run typecheck`
5. Commit with conventional format: `feat: add new feature`
6. Push and open a Pull Request

### Commit Message Format
We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `perf:` Performance improvements

Example:
```
feat: add rate limit fallback to alternative providers
fix: correct session state persistence
docs: update README with Bloxy mode examples
```

## Project Structure
```
src/
├── cli/          # CLI commands and TUI interface
├── tool/         # AI tool implementations
├── session/      # Session management
├── agent/        # Agent system
├── bloxy/        # Autonomous mode (Bloxy)
├── provider/     # LLM provider integrations
├── server/       # HTTP server
├── mcp/          # Model Context Protocol support
├── plugin/       # Plugin loading and management
└── util/         # Shared utilities
```

## Key Areas for Contribution

### High Impact Areas
- **Bloxy Mode Enhancements**: Improve autonomous task execution
- **Provider Integrations**: Add support for new LLM providers
- **Tool Development**: Create new AI tools
- **Documentation**: Improve docs and examples

### Good First Issues
Look for issues labeled `good first issue` in the GitHub issues tracker.

## Reporting Issues
Please use GitHub Issues with the provided templates:
- **Bug reports**: Use the bug report template
- **Feature requests**: Use the feature request template

## Code of Conduct
Be respectful and inclusive. We welcome contributors of all backgrounds and experience levels.

## License
By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?
Feel free to open a discussion or issue if you have questions about contributing.

---

Thank you for helping make BloxyCode better!
