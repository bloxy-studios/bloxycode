import { Provider } from "../provider/provider"
import { Log } from "../util/log"

export namespace SessionFallback {
  const log = Log.create({ service: "session.fallback" })

  export interface RateLimitInfo {
    providerID: string
    resetAt: number // timestamp when limit resets
    reason: string
  }

  export interface ProviderModel {
    providerID: string
    modelID: string
  }

  export interface ModelCapabilities {
    toolcall?: boolean
    attachment?: boolean
    reasoning?: boolean
  }

  // In-memory state tracking rate-limited providers
  const rateLimited = new Map<string, RateLimitInfo>()

  /**
   * Parse reset time from various header formats
   * Returns timestamp in milliseconds when the rate limit resets
   */
  export function parseResetTime(headers?: Record<string, string>): number | null {
    if (!headers) return null

    // Check x-ratelimit-reset (Unix timestamp in seconds)
    const xRateLimitReset = headers["x-ratelimit-reset"]
    if (xRateLimitReset) {
      const timestamp = Number.parseInt(xRateLimitReset, 10)
      if (!Number.isNaN(timestamp)) {
        // If it's a reasonable Unix timestamp (after year 2020)
        if (timestamp > 1577836800) {
          return timestamp * 1000 // Convert seconds to ms
        }
      }
    }

    // Check x-ratelimit-reset-requests (seconds until reset)
    const xRateLimitResetRequests = headers["x-ratelimit-reset-requests"]
    if (xRateLimitResetRequests) {
      // Parse formats like "1s", "2m30s", "1h"
      const match = xRateLimitResetRequests.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/)
      if (match) {
        const hours = Number.parseInt(match[1] || "0", 10)
        const minutes = Number.parseInt(match[2] || "0", 10)
        const seconds = Number.parseFloat(match[3] || "0")
        const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000
        if (totalMs > 0) {
          return Date.now() + totalMs
        }
      }
    }

    // Check retry-after-ms (milliseconds)
    const retryAfterMs = headers["retry-after-ms"]
    if (retryAfterMs) {
      const ms = Number.parseFloat(retryAfterMs)
      if (!Number.isNaN(ms) && ms > 0) {
        return Date.now() + ms
      }
    }

    // Check retry-after (seconds or HTTP-date)
    const retryAfter = headers["retry-after"]
    if (retryAfter) {
      // Try as seconds
      const seconds = Number.parseFloat(retryAfter)
      if (!Number.isNaN(seconds) && seconds > 0) {
        return Date.now() + seconds * 1000
      }
      // Try as HTTP-date
      const parsed = Date.parse(retryAfter)
      if (!Number.isNaN(parsed) && parsed > Date.now()) {
        return parsed
      }
    }

    return null
  }

  /**
   * Mark a provider as rate-limited
   */
  export function markRateLimited(
    providerID: string,
    reason: string,
    headers?: Record<string, string>,
  ): void {
    const resetAt = parseResetTime(headers) ?? Date.now() + 60_000 // Default: 1 minute

    rateLimited.set(providerID, {
      providerID,
      resetAt,
      reason,
    })

    log.info("Provider marked as rate-limited", {
      providerID,
      reason,
      resetAt: new Date(resetAt).toISOString(),
      waitMs: resetAt - Date.now(),
    })
  }

  /**
   * Check if a provider is currently rate-limited
   */
  export function isRateLimited(providerID: string): boolean {
    const info = rateLimited.get(providerID)
    if (!info) return false

    // Check if rate limit has expired
    if (Date.now() >= info.resetAt) {
      rateLimited.delete(providerID)
      log.info("Rate limit expired", { providerID })
      return false
    }

    return true
  }

  /**
   * Clear rate limit status for a provider
   */
  export function clearRateLimit(providerID: string): void {
    if (rateLimited.delete(providerID)) {
      log.info("Cleared rate limit", { providerID })
    }
  }

  /**
   * Clear all expired rate limits
   */
  export function clearExpiredLimits(): void {
    const now = Date.now()
    for (const [providerID, info] of rateLimited) {
      if (now >= info.resetAt) {
        rateLimited.delete(providerID)
        log.info("Cleared expired rate limit", { providerID })
      }
    }
  }

  /**
   * Get all currently rate-limited providers
   */
  export function getRateLimitedProviders(): RateLimitInfo[] {
    clearExpiredLimits()
    return Array.from(rateLimited.values())
  }

  /**
   * Get earliest reset time across all rate-limited providers
   * Returns null if no providers are rate-limited
   */
  export function getEarliestResetTime(): number | null {
    clearExpiredLimits()

    if (rateLimited.size === 0) return null

    let earliest = Infinity
    for (const info of rateLimited.values()) {
      if (info.resetAt < earliest) {
        earliest = info.resetAt
      }
    }

    return earliest === Infinity ? null : earliest
  }

  /**
   * Find the next available provider/model that isn't rate-limited
   * and has the required capabilities
   */
  export async function getNextAvailable(
    currentProviderID: string,
    capabilities?: ModelCapabilities,
  ): Promise<ProviderModel | null> {
    clearExpiredLimits()

    const providers = await Provider.list()

    for (const [providerID, provider] of Object.entries(providers)) {
      // Skip current provider
      if (providerID === currentProviderID) continue

      // Skip rate-limited providers
      if (isRateLimited(providerID)) continue

      // Find a model with required capabilities
      for (const [modelID, model] of Object.entries(provider.models)) {
        // Check capabilities if specified
        if (capabilities) {
          if (capabilities.toolcall && !model.capabilities.toolcall) continue
          if (capabilities.attachment && !model.capabilities.attachment) continue
          if (capabilities.reasoning && !model.capabilities.reasoning) continue
        }

        log.info("Found alternative provider", {
          from: currentProviderID,
          to: providerID,
          model: modelID,
        })

        return { providerID, modelID }
      }
    }

    log.info("No alternative providers available", {
      currentProviderID,
      rateLimited: Array.from(rateLimited.keys()),
    })

    return null
  }

  /**
   * Check if all configured providers are rate-limited
   */
  export async function allProvidersRateLimited(): Promise<boolean> {
    clearExpiredLimits()

    const providers = await Provider.list()
    const providerIDs = Object.keys(providers)

    if (providerIDs.length === 0) return false

    return providerIDs.every((id) => isRateLimited(id))
  }

  /**
   * Reset all rate limit tracking (useful for new sessions)
   */
  export function reset(): void {
    rateLimited.clear()
    log.info("Reset all rate limit tracking")
  }
}
