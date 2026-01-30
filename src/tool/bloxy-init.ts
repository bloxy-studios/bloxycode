import z from "zod"
import { Tool } from "./tool"
import { BloxyParser } from "../bloxy/parser"
import { BloxyState } from "../bloxy/state"
import { Instance } from "../project/instance"
import { Log } from "../util/log"

const log = Log.create({ service: "tool.bloxy-init" })

const Parameters = z.object({
  prdPath: z.string().describe("Path to the PRD file (e.g., PRD.md)"),
  dryRun: z.boolean().optional().describe("If true, only validate the PRD without creating a session"),
})

export const BloxyInitTool = Tool.define<
  typeof Parameters,
  { prdPath: string; taskCount?: number; error?: string; validated?: boolean }
>(
  "bloxy_init",
  {
    description: "Initialize a new Bloxy autonomous session by parsing a PRD file.",
    parameters: Parameters,
    async execute(args) {
      const worktree = Instance.worktree
      
      try {
        const result = await BloxyParser.parse({
          worktree,
          prdPath: args.prdPath,
        })

        if (args.dryRun) {
          log.info("Validated PRD (dry run)", { tasks: result.tasks.length })
          return {
            title: "PRD Validated",
            metadata: { prdPath: args.prdPath, taskCount: result.tasks.length, validated: true },
            output: `PRD file ${args.prdPath} is valid.\nFound ${result.tasks.length} tasks.`,
          }
        }

        const session = BloxyParser.createSession(result)
        await BloxyState.save(worktree, session)

        log.info("Initialized bloxy session", { tasks: session.tasks.length })

        const taskList = session.tasks.map((t, i) => `${i + 1}. [${t.status}] ${t.title}`).join("\n")

        return {
          title: "Bloxy Session Initialized",
          metadata: { prdPath: args.prdPath, taskCount: session.tasks.length },
          output: `Successfully initialized Bloxy session from ${args.prdPath}.\n\nFound ${session.tasks.length} tasks:\n${taskList}\n\nYou can now begin executing the first task.`,
        }
      } catch (error: any) {
        log.error("Failed to initialize bloxy session", { error })
        return {
          title: "Initialization Failed",
          metadata: { prdPath: args.prdPath, error: error.message },
          output: `Failed to initialize Bloxy session: ${error.message}`,
        }
      }
    },
  }
)
