# BloxyCode Release Script Setup

## Quick Start

```bash
# Simple release (AI-generated notes)
bun script/release.ts

# With custom message
bun script/release.ts -m "Fixed the authentication bug"

# Minor version bump
bun script/release.ts --minor -m "Added new Bloxy mode features"

# Major version bump
bun script/release.ts --major -m "Breaking: Redesigned API"
```

## AI-Powered Release Notes

The release script can automatically generate release notes by analyzing your git diff using the free Qwen3-Coder model via OpenRouter.

### Setup (One-time)

1. **Get a free OpenRouter API key:**
   - Go to https://openrouter.ai/settings/keys
   - Sign up (free) and create an API key
   - You get $1 free credits, and the Qwen model is free anyway

2. **Set the environment variable:**
   ```bash
   # Add to your ~/.bashrc or ~/.zshrc
   export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
   ```

3. **Done!** Now just run:
   ```bash
   bun script/release.ts
   ```
   The script will analyze your changes and generate appropriate release notes.

## Options

| Option | Description |
|--------|-------------|
| `-m "message"` | Custom release message (skips AI) |
| `--patch` | Patch version bump (default): 1.0.0 → 1.0.1 |
| `--minor` | Minor version bump: 1.0.0 → 1.1.0 |
| `--major` | Major version bump: 1.0.0 → 2.0.0 |
| `--fixed` | Category: Bug fix (default) |
| `--added` | Category: New feature |
| `--changed` | Category: Improvement/change |
| `--dry-run` | Preview without making changes |
| `--no-ai` | Skip AI generation |

## What It Does

1. 🤖 **Analyzes git diff** and generates release notes (if no `-m` provided)
2. 📦 **Bumps version** in package.json
3. 📝 **Updates** CHANGELOG.md, RELEASES.md, README.md
4. 📤 **Commits and tags** the release
5. 🚀 **Pushes to remote** (triggers CI)
6. 📋 **Creates GitHub Release**

## Examples

```bash
# Let AI analyze and describe your changes
bun script/release.ts

# Override with your own message
bun script/release.ts -m "Fixed PRD checkbox updates in Bloxy mode"

# New feature release
bun script/release.ts --minor --added -m "Added AI-powered release notes"

# Preview what would happen
bun script/release.ts --dry-run
```

## Troubleshooting

**"No OPENROUTER_API_KEY found"**
- Set the environment variable: `export OPENROUTER_API_KEY=sk-or-v1-...`

**"Could not get git diff"**
- Make sure you have staged changes (`git add`) or recent commits

**AI generates poor notes**
- Use `-m "your message"` to override
- The AI works best when changes are focused and well-structured
