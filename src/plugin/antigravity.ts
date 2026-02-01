/**
 * Re-export from the cloned antigravity plugin.
 * Based on opencode-antigravity-auth, adapted for BloxyCode paths.
 */
export {
  AntigravityCLIOAuthPlugin as AntigravityAuthPlugin,
  GoogleOAuthPlugin,
  createAntigravityPlugin,
} from "./antigravity/plugin"

export {
  authorizeAntigravity,
  exchangeAntigravity,
} from "./antigravity/antigravity/oauth"

export type {
  AntigravityAuthorization,
  AntigravityTokenExchangeResult,
} from "./antigravity/antigravity/oauth"

export type { AntigravityConfig } from "./antigravity/plugin/config/schema"
