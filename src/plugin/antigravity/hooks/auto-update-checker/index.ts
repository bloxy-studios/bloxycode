/**
 * Auto-update checker stub for BloxyCode.
 * The original auto-update checker is disabled in the BloxyCode fork
 * since BloxyCode has its own update mechanism.
 */

import type { PluginClient } from "../../plugin/types"

export interface AutoUpdateCheckerOptions {
  showStartupToast?: boolean
  autoUpdate?: boolean
}

export interface AutoUpdateCheckerHook {
  event: (input: { event: { type: string; properties?: unknown } }) => Promise<void>
}

// Use PluginClient type or a compatible interface
type Client = PluginClient | { toast?: (options: { type: string; title: string }) => void }

export function createAutoUpdateCheckerHook(
  _client: Client,
  _directory: string,
  _options?: AutoUpdateCheckerOptions
): AutoUpdateCheckerHook {
  // No-op implementation for BloxyCode
  return {
    event: async () => {
      // Do nothing - auto-update is handled elsewhere in BloxyCode
    },
  }
}
