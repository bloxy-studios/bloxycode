import z from "zod"
import { Tool } from "./tool"
import { BloxyState } from "../bloxy/state"
import { BloxyEvent } from "../bloxy/event"
import { Instance } from "../project/instance"
import { Log } from "../util/log"
import { Bus } from "../bus"

import DESCRIPTION from "./bloxy-control.txt"

const log = Log.create({ service: "tool.bloxy-control" })

const Parameters = z.object({
  action: z
    .enum(["task_complete", "task_failed", "run_tests"])
    .describe("The action to perform: task_complete, task_failed, or run_tests"),
  summary: z
    .string()
    .optional()
    .describe("For task_complete: brief summary of what was accomplished"),
  error: z
    .string()
    .optional()
    .describe("For task_failed: error message describing what went wrong"),
})

export const BloxyControlTool = Tool.define<
  typeof Parameters,
  { action: string; taskId?: string }
>("bloxy_control", {
  description: DESCRIPTION,
  parameters: Parameters,
  async execute(args, ctx) {
    const worktree = Instance.worktree
    const session = await BloxyState.load(worktree)

    if (!session) {
      return {
        title: "No bloxy session",
        metadata: { action: args.action },
        output: "No active Bloxy session found. Use /bloxy PRD.md to start one.",
      }
    }

    const task = BloxyState.getCurrentTask(session)
    if (!task) {
      return {
        title: "No current task",
        metadata: { action: args.action },
        output: "No current task in the Bloxy session. All tasks may be complete.",
      }
    }

    switch (args.action) {
      case "task_complete": {
        await BloxyState.markComplete(worktree, session, task.id, args.summary)

        // Publish event for session loop to continue
        await Bus.publish(BloxyEvent.TaskComplete, { sessionID: ctx.sessionID, taskId: task.id, summary: args.summary })

        const remaining = BloxyState.countRemaining(session)
        log.info("Task marked complete", { taskId: task.id, remaining })

        return {
          title: `Task completed: ${task.title}`,
          metadata: { action: args.action, taskId: task.id },
          output: remaining > 0
            ? `Task "${task.title}" completed successfully. ${remaining} task(s) remaining.`
            : `Task "${task.title}" completed. All tasks done!`,
        }
      }

      case "task_failed": {
        await BloxyState.markFailed(worktree, session, task.id, args.error)

        // Publish event for session loop to handle retry/continue
        await Bus.publish(BloxyEvent.TaskFailed, { sessionID: ctx.sessionID, taskId: task.id, error: args.error })

        const updatedSession = await BloxyState.load(worktree)
        const updatedTask = updatedSession?.tasks.find(t => t.id === task.id)

        log.error("Task marked failed", { taskId: task.id, error: args.error })

        if (updatedTask?.status === "pending") {
          return {
            title: `Task failed (will retry): ${task.title}`,
            metadata: { action: args.action, taskId: task.id },
            output: `Task "${task.title}" failed: ${args.error || "Unknown error"}. Will retry (attempt ${updatedTask.attempts}/${session.config.maxRetries}).`,
          }
        }

        return {
          title: `Task failed: ${task.title}`,
          metadata: { action: args.action, taskId: task.id },
          output: `Task "${task.title}" failed after ${session.config.maxRetries} attempts: ${args.error || "Unknown error"}.`,
        }
      }

      case "run_tests": {
        if (!session.config.testCommand) {
          return {
            title: "No test command configured",
            metadata: { action: args.action },
            output: "No test command is configured in the Bloxy session. Tests skipped.",
          }
        }

        return {
          title: "Run tests",
          metadata: { action: args.action },
          output: `Please run the test command: ${session.config.testCommand}`,
        }
      }

      default:
        return {
          title: "Unknown action",
          metadata: { action: args.action },
          output: `Unknown bloxy_control action: ${args.action}. Valid actions: task_complete, task_failed, run_tests`,
        }
    }
  },
})
