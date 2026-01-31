import { BusEvent } from "@/bus/bus-event"
import z from "zod"
import { Config } from "../config/config"
import { Instance } from "../project/instance"
import { Identifier } from "../id/id"
import PROMPT_INITIALIZE from "./template/initialize.txt"
import PROMPT_REVIEW from "./template/review.txt"
import PROMPT_BLOXY from "./template/bloxy.txt"
import PROMPT_BLOXY_INIT from "./template/bloxy-init.txt"
import PROMPT_BLOXY_CONFIG from "./template/bloxy-config.txt"
import PROMPT_BLOXY_RULE from "./template/bloxy-rule.txt"
import PROMPT_BLOXY_GH from "./template/bloxy-gh.txt"
import PROMPT_BLOXY_BROWSER from "./template/bloxy-browser.txt"
import PROMPT_BLOXY_STATUS from "./template/bloxy-status.txt"
import PROMPT_BLOXY_RESUME from "./template/bloxy-resume.txt"
import PROMPT_BLOXY_VALIDATE from "./template/bloxy-validate.txt"
// New configuration commands
import PROMPT_BLOXY_TESTS from "./template/bloxy-tests.txt"
import PROMPT_BLOXY_LINT from "./template/bloxy-lint.txt"
import PROMPT_BLOXY_COMMIT from "./template/bloxy-commit.txt"
import PROMPT_BLOXY_VERBOSE from "./template/bloxy-verbose.txt"
import PROMPT_BLOXY_RETRIES from "./template/bloxy-retries.txt"
import PROMPT_BLOXY_FAST from "./template/bloxy-fast.txt"
// New task source commands
import PROMPT_BLOXY_TASK from "./template/bloxy-task.txt"
import PROMPT_BLOXY_YAML from "./template/bloxy-yaml.txt"
import PROMPT_BLOXY_JSON from "./template/bloxy-json.txt"
// New Git/PR commands
import PROMPT_BLOXY_PR from "./template/bloxy-pr.txt"
import PROMPT_BLOXY_BRANCH from "./template/bloxy-branch.txt"
import PROMPT_BLOXY_BASE from "./template/bloxy-base.txt"
// New utility commands
import PROMPT_BLOXY_DRY_RUN from "./template/bloxy-dry-run.txt"
import PROMPT_BLOXY_PROGRESS from "./template/bloxy-progress.txt"
import { MCP } from "../mcp"

export namespace Command {
  export const Event = {
    Executed: BusEvent.define(
      "command.executed",
      z.object({
        name: z.string(),
        sessionID: Identifier.schema("session"),
        arguments: z.string(),
        messageID: Identifier.schema("message"),
      }),
    ),
  }

  export const Info = z
    .object({
      name: z.string(),
      description: z.string().optional(),
      agent: z.string().optional(),
      model: z.string().optional(),
      mcp: z.boolean().optional(),
      // workaround for zod not supporting async functions natively so we use getters
      // https://zod.dev/v4/changelog?id=zfunction
      template: z.promise(z.string()).or(z.string()),
      subtask: z.boolean().optional(),
      hints: z.array(z.string()),
    })
    .meta({
      ref: "Command",
    })

  // for some reason zod is inferring `string` for z.promise(z.string()).or(z.string()) so we have to manually override it
  export type Info = Omit<z.infer<typeof Info>, "template"> & { template: Promise<string> | string }

  export function hints(template: string): string[] {
    const result: string[] = []
    const numbered = template.match(/\$\d+/g)
    if (numbered) {
      for (const match of [...new Set(numbered)].sort()) result.push(match)
    }
    if (template.includes("$ARGUMENTS")) result.push("$ARGUMENTS")
    return result
  }

  export const Default = {
    INIT: "init",
    REVIEW: "review",
    BLOXY: "bloxy",
    BLOXY_INIT: "bloxy-init",
    BLOXY_CONFIG: "bloxy-config",
    BLOXY_RULE: "bloxy-rule",
    BLOXY_GH: "bloxy-gh",
    BLOXY_BROWSER: "bloxy-browser",
    BLOXY_STATUS: "bloxy-status",
    BLOXY_RESUME: "bloxy-resume",
    BLOXY_VALIDATE: "bloxy-validate",
    // Configuration commands
    BLOXY_TESTS: "bloxy-tests",
    BLOXY_LINT: "bloxy-lint",
    BLOXY_COMMIT: "bloxy-commit",
    BLOXY_VERBOSE: "bloxy-verbose",
    BLOXY_RETRIES: "bloxy-retries",
    BLOXY_FAST: "bloxy-fast",
    // Task source commands
    BLOXY_TASK: "bloxy-task",
    BLOXY_YAML: "bloxy-yaml",
    BLOXY_JSON: "bloxy-json",
    // Git/PR commands
    BLOXY_PR: "bloxy-pr",
    BLOXY_BRANCH: "bloxy-branch",
    BLOXY_BASE: "bloxy-base",
    // Utility commands
    BLOXY_DRY_RUN: "bloxy-dry-run",
    BLOXY_PROGRESS: "bloxy-progress",
  } as const

  const state = Instance.state(async () => {
    const cfg = await Config.get()

    const result: Record<string, Info> = {
      [Default.INIT]: {
        name: Default.INIT,
        description: "create/update AGENTS.md",
        get template() {
          return PROMPT_INITIALIZE.replace("${path}", Instance.worktree)
        },
        hints: hints(PROMPT_INITIALIZE),
      },
      [Default.REVIEW]: {
        name: Default.REVIEW,
        description: "review changes [commit|branch|pr], defaults to uncommitted",
        get template() {
          return PROMPT_REVIEW.replace("${path}", Instance.worktree)
        },
        subtask: true,
        hints: hints(PROMPT_REVIEW),
      },
      [Default.BLOXY]: {
        name: Default.BLOXY,
        description: "start autonomous task execution from PRD file [path], defaults to PRD.md",
        agent: "bloxy",
        get template() {
          return PROMPT_BLOXY
        },
        hints: hints(PROMPT_BLOXY),
      },
      [Default.BLOXY_INIT]: {
        name: Default.BLOXY_INIT,
        description: "initialize a new Bloxy PRD file",
        get template() {
          return PROMPT_BLOXY_INIT.replace("${path}", Instance.worktree)
        },
        hints: hints(PROMPT_BLOXY_INIT),
      },
      [Default.BLOXY_CONFIG]: {
        name: Default.BLOXY_CONFIG,
        description: "show current Bloxy configuration",
        get template() {
          return PROMPT_BLOXY_CONFIG
        },
        hints: [],
      },
      [Default.BLOXY_RULE]: {
        name: Default.BLOXY_RULE,
        description: "add a rule to Bloxy configuration [rule]",
        get template() {
          return PROMPT_BLOXY_RULE
        },
        hints: hints(PROMPT_BLOXY_RULE),
      },
      [Default.BLOXY_GH]: {
        name: Default.BLOXY_GH,
        description: "create PRD from GitHub issues [repo] [label]",
        get template() {
          return PROMPT_BLOXY_GH
        },
        hints: hints(PROMPT_BLOXY_GH),
      },
      [Default.BLOXY_BROWSER]: {
        name: Default.BLOXY_BROWSER,
        description: "configure browser capabilities [on|off|auto]",
        get template() {
          return PROMPT_BLOXY_BROWSER
        },
        hints: hints(PROMPT_BLOXY_BROWSER),
      },
      [Default.BLOXY_STATUS]: {
        name: Default.BLOXY_STATUS,
        description: "show current Bloxy task execution status",
        get template() {
          return PROMPT_BLOXY_STATUS
        },
        hints: [],
      },
      [Default.BLOXY_RESUME]: {
        name: Default.BLOXY_RESUME,
        description: "resume Bloxy from last failure [--skip-failed]",
        agent: "bloxy",
        get template() {
          return PROMPT_BLOXY_RESUME
        },
        hints: hints(PROMPT_BLOXY_RESUME),
      },
      [Default.BLOXY_VALIDATE]: {
        name: Default.BLOXY_VALIDATE,
        description: "validate PRD file syntax without executing [path]",
        get template() {
          return PROMPT_BLOXY_VALIDATE
        },
        hints: hints(PROMPT_BLOXY_VALIDATE),
      },
      // Configuration commands
      [Default.BLOXY_TESTS]: {
        name: Default.BLOXY_TESTS,
        description: "toggle test execution [on|off]",
        get template() {
          return PROMPT_BLOXY_TESTS
        },
        hints: hints(PROMPT_BLOXY_TESTS),
      },
      [Default.BLOXY_LINT]: {
        name: Default.BLOXY_LINT,
        description: "toggle lint execution [on|off]",
        get template() {
          return PROMPT_BLOXY_LINT
        },
        hints: hints(PROMPT_BLOXY_LINT),
      },
      [Default.BLOXY_COMMIT]: {
        name: Default.BLOXY_COMMIT,
        description: "toggle auto-commit [on|off]",
        get template() {
          return PROMPT_BLOXY_COMMIT
        },
        hints: hints(PROMPT_BLOXY_COMMIT),
      },
      [Default.BLOXY_VERBOSE]: {
        name: Default.BLOXY_VERBOSE,
        description: "toggle verbose output [on|off]",
        get template() {
          return PROMPT_BLOXY_VERBOSE
        },
        hints: hints(PROMPT_BLOXY_VERBOSE),
      },
      [Default.BLOXY_RETRIES]: {
        name: Default.BLOXY_RETRIES,
        description: "set max retry attempts [N]",
        get template() {
          return PROMPT_BLOXY_RETRIES
        },
        hints: hints(PROMPT_BLOXY_RETRIES),
      },
      [Default.BLOXY_FAST]: {
        name: Default.BLOXY_FAST,
        description: "enable fast mode (skip tests and lint)",
        get template() {
          return PROMPT_BLOXY_FAST
        },
        hints: [],
      },
      // Task source commands
      [Default.BLOXY_TASK]: {
        name: Default.BLOXY_TASK,
        description: "execute a single task directly [task]",
        agent: "bloxy",
        get template() {
          return PROMPT_BLOXY_TASK
        },
        hints: hints(PROMPT_BLOXY_TASK),
      },
      [Default.BLOXY_YAML]: {
        name: Default.BLOXY_YAML,
        description: "start autonomous execution from YAML file [path]",
        agent: "bloxy",
        get template() {
          return PROMPT_BLOXY_YAML
        },
        hints: hints(PROMPT_BLOXY_YAML),
      },
      [Default.BLOXY_JSON]: {
        name: Default.BLOXY_JSON,
        description: "start autonomous execution from JSON file [path]",
        agent: "bloxy",
        get template() {
          return PROMPT_BLOXY_JSON
        },
        hints: hints(PROMPT_BLOXY_JSON),
      },
      // Git/PR commands
      [Default.BLOXY_PR]: {
        name: Default.BLOXY_PR,
        description: "create pull request for Bloxy changes [--draft]",
        get template() {
          return PROMPT_BLOXY_PR
        },
        hints: hints(PROMPT_BLOXY_PR),
      },
      [Default.BLOXY_BRANCH]: {
        name: Default.BLOXY_BRANCH,
        description: "toggle branch-per-task mode [on|off]",
        get template() {
          return PROMPT_BLOXY_BRANCH
        },
        hints: hints(PROMPT_BLOXY_BRANCH),
      },
      [Default.BLOXY_BASE]: {
        name: Default.BLOXY_BASE,
        description: "set base branch for PRs [branch]",
        get template() {
          return PROMPT_BLOXY_BASE
        },
        hints: hints(PROMPT_BLOXY_BASE),
      },
      // Utility commands
      [Default.BLOXY_DRY_RUN]: {
        name: Default.BLOXY_DRY_RUN,
        description: "preview execution without making changes [path]",
        get template() {
          return PROMPT_BLOXY_DRY_RUN
        },
        hints: hints(PROMPT_BLOXY_DRY_RUN),
      },
      [Default.BLOXY_PROGRESS]: {
        name: Default.BLOXY_PROGRESS,
        description: "show detailed progress log",
        get template() {
          return PROMPT_BLOXY_PROGRESS
        },
        hints: [],
      },
    }

    for (const [name, command] of Object.entries(cfg.command ?? {})) {
      result[name] = {
        name,
        agent: command.agent,
        model: command.model,
        description: command.description,
        get template() {
          return command.template
        },
        subtask: command.subtask,
        hints: hints(command.template),
      }
    }
    for (const [name, prompt] of Object.entries(await MCP.prompts())) {
      result[name] = {
        name,
        mcp: true,
        description: prompt.description,
        get template() {
          // since a getter can't be async we need to manually return a promise here
          return new Promise<string>(async (resolve, reject) => {
            const template = await MCP.getPrompt(
              prompt.client,
              prompt.name,
              prompt.arguments
                ? // substitute each argument with $1, $2, etc.
                  Object.fromEntries(prompt.arguments?.map((argument, i) => [argument.name, `$${i + 1}`]))
                : {},
            ).catch(reject)
            resolve(
              template?.messages
                .map((message) => (message.content.type === "text" ? message.content.text : ""))
                .join("\n") || "",
            )
          })
        },
        hints: prompt.arguments?.map((_, i) => `$${i + 1}`) ?? [],
      }
    }

    return result
  })

  export async function get(name: string) {
    return state().then((x) => x[name])
  }

  export async function list() {
    return state().then((x) => Object.values(x))
  }
}
