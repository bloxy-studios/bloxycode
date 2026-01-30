function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

export namespace Flag {
  export const BLOXYCODE_AUTO_SHARE = truthy("BLOXYCODE_AUTO_SHARE")
  export const BLOXYCODE_GIT_BASH_PATH = process.env["BLOXYCODE_GIT_BASH_PATH"]
  export const BLOXYCODE_CONFIG = process.env["BLOXYCODE_CONFIG"]
  export declare const BLOXYCODE_CONFIG_DIR: string | undefined
  export const BLOXYCODE_CONFIG_CONTENT = process.env["BLOXYCODE_CONFIG_CONTENT"]
  export const BLOXYCODE_DISABLE_AUTOUPDATE = truthy("BLOXYCODE_DISABLE_AUTOUPDATE")
  export const BLOXYCODE_DISABLE_PRUNE = truthy("BLOXYCODE_DISABLE_PRUNE")
  export const BLOXYCODE_DISABLE_TERMINAL_TITLE = truthy("BLOXYCODE_DISABLE_TERMINAL_TITLE")
  export const BLOXYCODE_PERMISSION = process.env["BLOXYCODE_PERMISSION"]
  export const BLOXYCODE_DISABLE_DEFAULT_PLUGINS = truthy("BLOXYCODE_DISABLE_DEFAULT_PLUGINS")
  export const BLOXYCODE_DISABLE_LSP_DOWNLOAD = truthy("BLOXYCODE_DISABLE_LSP_DOWNLOAD")
  export const BLOXYCODE_ENABLE_EXPERIMENTAL_MODELS = truthy("BLOXYCODE_ENABLE_EXPERIMENTAL_MODELS")
  export const BLOXYCODE_DISABLE_AUTOCOMPACT = truthy("BLOXYCODE_DISABLE_AUTOCOMPACT")
  export const BLOXYCODE_DISABLE_MODELS_FETCH = truthy("BLOXYCODE_DISABLE_MODELS_FETCH")
  export const BLOXYCODE_DISABLE_CLAUDE_CODE = truthy("BLOXYCODE_DISABLE_CLAUDE_CODE")
  export const BLOXYCODE_DISABLE_CLAUDE_CODE_PROMPT =
    BLOXYCODE_DISABLE_CLAUDE_CODE || truthy("BLOXYCODE_DISABLE_CLAUDE_CODE_PROMPT")
  export const BLOXYCODE_DISABLE_CLAUDE_CODE_SKILLS =
    BLOXYCODE_DISABLE_CLAUDE_CODE || truthy("BLOXYCODE_DISABLE_CLAUDE_CODE_SKILLS")
  export declare const BLOXYCODE_DISABLE_PROJECT_CONFIG: boolean
  export const BLOXYCODE_FAKE_VCS = process.env["BLOXYCODE_FAKE_VCS"]
  export const BLOXYCODE_CLIENT = process.env["BLOXYCODE_CLIENT"] ?? "cli"
  export const BLOXYCODE_SERVER_PASSWORD = process.env["BLOXYCODE_SERVER_PASSWORD"]
  export const BLOXYCODE_SERVER_USERNAME = process.env["BLOXYCODE_SERVER_USERNAME"]

  // Experimental
  export const BLOXYCODE_EXPERIMENTAL = truthy("BLOXYCODE_EXPERIMENTAL")
  export const BLOXYCODE_EXPERIMENTAL_FILEWATCHER = truthy("BLOXYCODE_EXPERIMENTAL_FILEWATCHER")
  export const BLOXYCODE_EXPERIMENTAL_DISABLE_FILEWATCHER = truthy("BLOXYCODE_EXPERIMENTAL_DISABLE_FILEWATCHER")
  export const BLOXYCODE_EXPERIMENTAL_ICON_DISCOVERY =
    BLOXYCODE_EXPERIMENTAL || truthy("BLOXYCODE_EXPERIMENTAL_ICON_DISCOVERY")
  export const BLOXYCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT = truthy("BLOXYCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
  export const BLOXYCODE_ENABLE_EXA =
    truthy("BLOXYCODE_ENABLE_EXA") || BLOXYCODE_EXPERIMENTAL || truthy("BLOXYCODE_EXPERIMENTAL_EXA")
  export const BLOXYCODE_EXPERIMENTAL_BASH_MAX_OUTPUT_LENGTH = number("BLOXYCODE_EXPERIMENTAL_BASH_MAX_OUTPUT_LENGTH")
  export const BLOXYCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS = number("BLOXYCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS")
  export const BLOXYCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX = number("BLOXYCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX")
  export const BLOXYCODE_EXPERIMENTAL_OXFMT = BLOXYCODE_EXPERIMENTAL || truthy("BLOXYCODE_EXPERIMENTAL_OXFMT")
  export const BLOXYCODE_EXPERIMENTAL_LSP_TY = truthy("BLOXYCODE_EXPERIMENTAL_LSP_TY")
  export const BLOXYCODE_EXPERIMENTAL_LSP_TOOL = BLOXYCODE_EXPERIMENTAL || truthy("BLOXYCODE_EXPERIMENTAL_LSP_TOOL")
  export const BLOXYCODE_DISABLE_FILETIME_CHECK = truthy("BLOXYCODE_DISABLE_FILETIME_CHECK")
  export const BLOXYCODE_EXPERIMENTAL_PLAN_MODE = BLOXYCODE_EXPERIMENTAL || truthy("BLOXYCODE_EXPERIMENTAL_PLAN_MODE")
  export const BLOXYCODE_MODELS_URL = process.env["BLOXYCODE_MODELS_URL"]

  function number(key: string) {
    const value = process.env[key]
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
}

// Dynamic getter for BLOXYCODE_DISABLE_PROJECT_CONFIG
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "BLOXYCODE_DISABLE_PROJECT_CONFIG", {
  get() {
    return truthy("BLOXYCODE_DISABLE_PROJECT_CONFIG")
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for BLOXYCODE_CONFIG_DIR
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "BLOXYCODE_CONFIG_DIR", {
  get() {
    return process.env["BLOXYCODE_CONFIG_DIR"]
  },
  enumerable: true,
  configurable: false,
})
