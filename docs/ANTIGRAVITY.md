# Antigravity Integration

BloxyCode includes native support for **Antigravity** - Google's OAuth-based access to Claude and Gemini models through your Google account.

## What You Get

- **Claude Opus 4.5 and Sonnet 4.5** via Antigravity quota
- **Gemini 3 Pro/Flash** with thinking capabilities
- **Multi-account support** — add multiple Google accounts, auto-rotates when rate-limited
- **Free tier** — uses your Google Cloud quota, no API keys needed

## Quick Start

### 1. Login with Google

```bash
bloxycode auth login
```

Select "Login with Google (Antigravity)" and follow the prompts to authorize with your Google account.

### 2. Add Models to Configuration

Add this to your `~/.config/bloxycode/bloxycode.json`:

```json
{
  "provider": {
    "antigravity": {
      "models": {
        "antigravity-claude-sonnet-4-5": {
          "name": "Claude Sonnet 4.5 (Antigravity)",
          "limit": { "context": 200000, "output": 64000 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] }
        },
        "antigravity-claude-sonnet-4-5-thinking": {
          "name": "Claude Sonnet 4.5 Thinking (Antigravity)",
          "limit": { "context": 200000, "output": 64000 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "reasoning": true,
          "variants": {
            "low": { "thinkingConfig": { "thinkingBudget": 8192 } },
            "max": { "thinkingConfig": { "thinkingBudget": 32768 } }
          }
        },
        "antigravity-claude-opus-4-5-thinking": {
          "name": "Claude Opus 4.5 Thinking (Antigravity)",
          "limit": { "context": 200000, "output": 64000 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "reasoning": true,
          "variants": {
            "low": { "thinkingConfig": { "thinkingBudget": 8192 } },
            "max": { "thinkingConfig": { "thinkingBudget": 32768 } }
          }
        },
        "antigravity-gemini-3-pro": {
          "name": "Gemini 3 Pro (Antigravity)",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "variants": {
            "low": { "thinkingLevel": "low" },
            "high": { "thinkingLevel": "high" }
          }
        },
        "antigravity-gemini-3-flash": {
          "name": "Gemini 3 Flash (Antigravity)",
          "limit": { "context": 1048576, "output": 65536 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "variants": {
            "minimal": { "thinkingLevel": "minimal" },
            "low": { "thinkingLevel": "low" },
            "medium": { "thinkingLevel": "medium" },
            "high": { "thinkingLevel": "high" }
          }
        }
      }
    }
  }
}
```

### 3. Use the Models

```bash
# Use Claude Sonnet via Antigravity
bloxycode run "Hello" --model=antigravity/antigravity-claude-sonnet-4-5

# Use Claude with thinking (extended reasoning)
bloxycode run "Solve this problem" --model=antigravity/antigravity-claude-sonnet-4-5-thinking --variant=max

# Use Gemini 3 Pro
bloxycode run "Explain quantum computing" --model=antigravity/antigravity-gemini-3-pro
```

## Multi-Account Setup

Add multiple Google accounts for higher combined quotas. When one account is rate-limited, BloxyCode automatically switches to another.

```bash
# Run auth login again to add another account
bloxycode auth login
```

Accounts are stored in `~/.config/bloxycode/antigravity-accounts.json`.

## Rate Limit Handling

BloxyCode automatically:
1. Detects when an account hits rate limits
2. Switches to another available account
3. Waits for rate limits to reset if all accounts are exhausted
4. Tracks rate limit expiry times per account

## Troubleshooting

### "No valid Antigravity accounts available"

Run `bloxycode auth login` and select "Login with Google (Antigravity)".

### Rate limited on all accounts

Wait for rate limits to reset (usually 1-5 minutes), or add more Google accounts.

### Reset rate limit tracking

Delete the accounts file and re-authenticate:

```bash
rm ~/.config/bloxycode/antigravity-accounts.json
bloxycode auth login
```

## Terms of Service Warning

Using Antigravity may violate Google's Terms of Service. Use at your own risk. Consider using established Google accounts rather than creating new ones specifically for this purpose.

## Credits

This integration is inspired by [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth) by @NoeFabris.
