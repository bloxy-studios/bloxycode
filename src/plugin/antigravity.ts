import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { Installation } from "@/installation"
import { Global } from "@/global"
import path from "path"
import fs from "fs/promises"
import z from "zod"

// Google OAuth configuration for Antigravity
const GOOGLE_CLIENT_ID = "77185425430.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "OTJgUOQcT7lO7GsGZq2G4IlT"
const GOOGLE_DEVICE_AUTH_URL = "https://oauth2.googleapis.com/device/code"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const ANTIGRAVITY_API_BASE = "https://autopush-aicompanion-pa.sandbox.googleapis.com"

// Account storage schema
const AntigravityAccountSchema = z.object({
  email: z.string(),
  refreshToken: z.string(),
  accessToken: z.string().optional(),
  accessTokenExpiry: z.number().optional(),
  projectId: z.string().optional(),
  rateLimitedUntil: z.number().optional(),
  enabled: z.boolean().default(true),
})
type AntigravityAccount = z.infer<typeof AntigravityAccountSchema>

const AntigravityAccountsSchema = z.object({
  accounts: z.array(AntigravityAccountSchema),
  currentIndex: z.number().default(0),
})
type AntigravityAccountsData = z.infer<typeof AntigravityAccountsSchema>

// Accounts file path
const accountsFilePath = path.join(Global.Path.config, "antigravity-accounts.json")

// Account management
async function loadAccounts(): Promise<AntigravityAccountsData> {
  try {
    const file = Bun.file(accountsFilePath)
    if (await file.exists()) {
      const data = await file.json()
      return AntigravityAccountsSchema.parse(data)
    }
  } catch {}
  return { accounts: [], currentIndex: 0 }
}

async function saveAccounts(accounts: AntigravityAccountsData): Promise<void> {
  await Bun.write(accountsFilePath, JSON.stringify(accounts, null, 2))
  await fs.chmod(accountsFilePath, 0o600)
}

async function refreshAccessToken(account: AntigravityAccount): Promise<string | null> {
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) return null

    const data = (await response.json()) as {
      access_token: string
      expires_in: number
    }

    account.accessToken = data.access_token
    account.accessTokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // 1 min buffer

    return data.access_token
  } catch {
    return null
  }
}

async function getValidAccount(): Promise<{ account: AntigravityAccount; index: number } | null> {
  const accounts = await loadAccounts()
  if (accounts.accounts.length === 0) return null

  const now = Date.now()
  const enabledAccounts = accounts.accounts
    .map((acc: AntigravityAccount, idx: number) => ({ account: acc, index: idx }))
    .filter((item: { account: AntigravityAccount; index: number }) => item.account.enabled)

  // Try to find an account that's not rate limited
  for (const item of enabledAccounts) {
    if (item.account.rateLimitedUntil && item.account.rateLimitedUntil > now) {
      continue
    }

    // Check if access token needs refresh
    if (!item.account.accessToken || (item.account.accessTokenExpiry && item.account.accessTokenExpiry < now)) {
      const newToken = await refreshAccessToken(item.account)
      if (!newToken) continue
      await saveAccounts(accounts)
    }

    return item
  }

  // All accounts rate limited, find the one that recovers soonest
  type AccountWithIndex = { account: AntigravityAccount; index: number }
  const sortedByRecovery = enabledAccounts
    .filter((item: AccountWithIndex) => item.account.rateLimitedUntil)
    .sort((a: AccountWithIndex, b: AccountWithIndex) => (a.account.rateLimitedUntil || 0) - (b.account.rateLimitedUntil || 0))

  if (sortedByRecovery.length > 0) {
    const first = sortedByRecovery[0]
    const waitTime = (first.account.rateLimitedUntil || 0) - now
    if (waitTime > 0 && waitTime < 300000) {
      // Wait up to 5 minutes
      await Bun.sleep(waitTime + 1000)
      first.account.rateLimitedUntil = undefined
      await saveAccounts(accounts)
      return first
    }
  }

  return null
}

async function markAccountRateLimited(index: number, resetAfterMs: number = 60000): Promise<void> {
  const accounts = await loadAccounts()
  if (accounts.accounts[index]) {
    accounts.accounts[index].rateLimitedUntil = Date.now() + resetAfterMs
    await saveAccounts(accounts)
  }
}

export async function AntigravityAuthPlugin(input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "antigravity",
      async loader(getAuth, provider) {
        const accounts = await loadAccounts()
        if (accounts.accounts.length === 0) return {}

        if (provider && provider.models) {
          for (const model of Object.values(provider.models)) {
            // Antigravity models are free (use Google quota)
            model.cost = {
              input: 0,
              output: 0,
              cache: { read: 0, write: 0 },
            }
          }
        }

        return {
          apiKey: "antigravity-oauth",
          async fetch(request: RequestInfo | URL, init?: RequestInit) {
            const accountInfo = await getValidAccount()
            if (!accountInfo) {
              throw new Error("No valid Antigravity accounts available. Run 'bloxycode auth login' to add an account.")
            }

            const { account, index } = accountInfo

            const headers: Record<string, string> = {
              ...(init?.headers as Record<string, string>),
              Authorization: `Bearer ${account.accessToken}`,
              "User-Agent": `bloxycode/${Installation.VERSION}`,
              "Content-Type": "application/json",
            }

            // Remove any conflicting auth headers
            delete headers["x-api-key"]

            const response = await fetch(request, {
              ...init,
              headers,
            })

            // Handle rate limiting
            if (response.status === 429) {
              const retryAfter = response.headers.get("retry-after")
              const resetMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000
              await markAccountRateLimited(index, resetMs)

              // Try with another account
              const nextAccount = await getValidAccount()
              if (nextAccount && nextAccount.index !== index) {
                headers.Authorization = `Bearer ${nextAccount.account.accessToken}`
                return fetch(request, { ...init, headers })
              }
            }

            return response
          },
        }
      },
      methods: [
        {
          type: "oauth",
          label: "Login with Google (Antigravity)",
          async authorize() {
            // Google Device Code OAuth flow
            const deviceResponse = await fetch(GOOGLE_DEVICE_AUTH_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                scope: "openid email profile https://www.googleapis.com/auth/cloud-platform",
              }),
            })

            if (!deviceResponse.ok) {
              throw new Error("Failed to initiate Google device authorization")
            }

            const deviceData = (await deviceResponse.json()) as {
              verification_url: string
              user_code: string
              device_code: string
              interval: number
              expires_in: number
            }

            return {
              url: deviceData.verification_url,
              instructions: `Enter code: ${deviceData.user_code}`,
              method: "auto" as const,
              async callback() {
                const startTime = Date.now()
                const expiresAt = startTime + deviceData.expires_in * 1000

                while (Date.now() < expiresAt) {
                  const response = await fetch(GOOGLE_TOKEN_URL, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                      client_id: GOOGLE_CLIENT_ID,
                      client_secret: GOOGLE_CLIENT_SECRET,
                      device_code: deviceData.device_code,
                      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                    }),
                  })

                  const data = (await response.json()) as {
                    access_token?: string
                    refresh_token?: string
                    expires_in?: number
                    id_token?: string
                    error?: string
                  }

                  if (data.access_token && data.refresh_token) {
                    // Get user email from ID token or userinfo
                    let email = "unknown"
                    try {
                      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                        headers: { Authorization: `Bearer ${data.access_token}` },
                      })
                      if (userInfoResponse.ok) {
                        const userInfo = (await userInfoResponse.json()) as { email: string }
                        email = userInfo.email
                      }
                    } catch {}

                    // Save to accounts file
                    const accounts = await loadAccounts()

                    // Check if account already exists
                    const existingIndex = accounts.accounts.findIndex((a: AntigravityAccount) => a.email === email)
                    const newAccount: AntigravityAccount = {
                      email,
                      refreshToken: data.refresh_token,
                      accessToken: data.access_token,
                      accessTokenExpiry: Date.now() + (data.expires_in || 3600) * 1000 - 60000,
                      enabled: true,
                    }

                    if (existingIndex >= 0) {
                      accounts.accounts[existingIndex] = newAccount
                    } else {
                      accounts.accounts.push(newAccount)
                    }

                    await saveAccounts(accounts)

                    return {
                      type: "success" as const,
                      refresh: data.refresh_token,
                      access: data.access_token,
                      expires: Date.now() + (data.expires_in || 3600) * 1000,
                      accountId: email,
                    }
                  }

                  if (data.error === "authorization_pending") {
                    await Bun.sleep(deviceData.interval * 1000 + 1000)
                    continue
                  }

                  if (data.error === "slow_down") {
                    await Bun.sleep((deviceData.interval + 5) * 1000)
                    continue
                  }

                  if (data.error) {
                    return { type: "failed" as const }
                  }

                  await Bun.sleep(deviceData.interval * 1000)
                }

                return { type: "failed" as const }
              },
            }
          },
        },
      ],
    },
    // Add thinking block support for Claude models via Antigravity
    "chat.headers": async (input, output) => {
      if (!input.model.providerID.includes("antigravity")) return

      if (input.model.id.includes("claude")) {
        output.headers["anthropic-beta"] = "interleaved-thinking-2025-05-14"
      }
    },
  }
}

// Export account management functions for CLI
export const AntigravityAccounts = {
  async list(): Promise<Array<{ email: string; enabled: boolean; rateLimited: boolean }>> {
    const accounts = await loadAccounts()
    const now = Date.now()
    return accounts.accounts.map((acc: AntigravityAccount) => ({
      email: acc.email,
      enabled: acc.enabled,
      rateLimited: acc.rateLimitedUntil ? acc.rateLimitedUntil > now : false,
    }))
  },

  async remove(email: string): Promise<boolean> {
    const accounts = await loadAccounts()
    const index = accounts.accounts.findIndex((a: AntigravityAccount) => a.email === email)
    if (index >= 0) {
      accounts.accounts.splice(index, 1)
      await saveAccounts(accounts)
      return true
    }
    return false
  },

  async toggle(email: string, enabled: boolean): Promise<boolean> {
    const accounts = await loadAccounts()
    const account = accounts.accounts.find((a: AntigravityAccount) => a.email === email)
    if (account) {
      account.enabled = enabled
      await saveAccounts(accounts)
      return true
    }
    return false
  },

  async clearRateLimits(): Promise<void> {
    const accounts = await loadAccounts()
    for (const account of accounts.accounts) {
      account.rateLimitedUntil = undefined
    }
    await saveAccounts(accounts)
  },
}
