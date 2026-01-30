import z from "zod"
import path from "path"
import fs from "fs/promises"
import { Log } from "../util/log"

export namespace BloxyState {
  const log = Log.create({ service: "bloxy.state" })

  export const Task = z.object({
    id: z.string(),
    title: z.string(),
    body: z.string().optional(),
    status: z.enum(["pending", "in_progress", "completed", "failed", "deferred"]),
    attempts: z.number().default(0),
    error: z.string().optional(),
    summary: z.string().optional(),
    time: z.object({
      started: z.number().optional(),
      completed: z.number().optional(),
    }).default({}),
  })
  export type Task = z.infer<typeof Task>

  export const Config = z.object({
    maxRetries: z.number().default(3),
    retryDelay: z.number().default(5000),
    runTests: z.boolean().default(true),
    testCommand: z.string().optional(),
    lintCommand: z.string().optional(),
    stopOnError: z.boolean().default(false),
    autoCommit: z.boolean().default(false),
  })
  export type Config = z.infer<typeof Config>

  export const Session = z.object({
    tasks: z.array(Task),
    currentTaskIndex: z.number().default(0),
    prdPath: z.string(),
    config: Config,
    status: z.enum(["idle", "running", "paused", "completed", "failed"]).default("idle"),
    time: z.object({
      started: z.number().optional(),
      completed: z.number().optional(),
    }).default({}),
  })
  export type Session = z.infer<typeof Session>

  const STATE_FILE = ".bloxycode/bloxy-state.json"

  function statePath(worktree: string): string {
    return path.join(worktree, STATE_FILE)
  }

  export async function load(worktree: string): Promise<Session | null> {
    const filepath = statePath(worktree)
    try {
      const content = await fs.readFile(filepath, "utf-8")
      const data = JSON.parse(content)
      return Session.parse(data)
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        return null
      }
      log.error("Failed to load bloxy state", { error: e })
      return null
    }
  }

  export async function save(worktree: string, session: Session): Promise<void> {
    const filepath = statePath(worktree)
    const dir = path.dirname(filepath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filepath, JSON.stringify(session, null, 2))
    log.info("Saved bloxy state", { tasks: session.tasks.length, current: session.currentTaskIndex })
  }

  export async function remove(worktree: string): Promise<void> {
    const filepath = statePath(worktree)
    try {
      await fs.unlink(filepath)
      log.info("Removed bloxy state")
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        log.error("Failed to remove bloxy state", { error: e })
      }
    }
  }

  export function getCurrentTask(session: Session): Task | null {
    if (session.currentTaskIndex >= session.tasks.length) {
      return null
    }
    return session.tasks[session.currentTaskIndex]
  }

  export function getNextPendingTask(session: Session): Task | null {
    for (let i = session.currentTaskIndex; i < session.tasks.length; i++) {
      const status = session.tasks[i].status
      if (status === "pending" || status === "in_progress") {
        return session.tasks[i]
      }
    }
    return null
  }

  export function getNextActionableTask(session: Session, skipFailed = false): Task | null {
    for (let i = 0; i < session.tasks.length; i++) {
      const status = session.tasks[i].status
      if (status === "pending" || status === "in_progress") {
        return session.tasks[i]
      }
      if (!skipFailed && status === "failed") {
        return session.tasks[i]
      }
    }
    return null
  }

  export function countRemaining(session: Session): number {
    return session.tasks.filter(t => t.status === "pending" || t.status === "in_progress").length
  }

  export function countCompleted(session: Session): number {
    return session.tasks.filter(t => t.status === "completed").length
  }

  export function countFailed(session: Session): number {
    return session.tasks.filter(t => t.status === "failed").length
  }

  export function countDeferred(session: Session): number {
    return session.tasks.filter(t => t.status === "deferred").length
  }

  export async function markInProgress(worktree: string, session: Session, taskId: string): Promise<Session> {
    const task = session.tasks.find(t => t.id === taskId)
    if (task) {
      task.status = "in_progress"
      task.time.started = Date.now()
      task.attempts += 1
    }
    session.status = "running"
    await save(worktree, session)
    return session
  }

  export async function markComplete(worktree: string, session: Session, taskId: string, summary?: string): Promise<Session> {
    const task = session.tasks.find(t => t.id === taskId)
    if (task) {
      task.status = "completed"
      task.time.completed = Date.now()
      if (summary) task.summary = summary
    }

    // Find next pending task index
    const nextIndex = session.tasks.findIndex((t, i) =>
      i > session.currentTaskIndex && (t.status === "pending" || t.status === "in_progress")
    )

    if (nextIndex === -1) {
      // All tasks done
      session.currentTaskIndex = session.tasks.length
      const allCompleted = session.tasks.every(t => t.status === "completed")
      session.status = allCompleted ? "completed" : "failed"
      session.time.completed = Date.now()
    } else {
      session.currentTaskIndex = nextIndex
    }

    await save(worktree, session)
    log.info("Task completed", { taskId, remaining: countRemaining(session) })
    return session
  }

  export async function markFailed(worktree: string, session: Session, taskId: string, error?: string): Promise<Session> {
    const task = session.tasks.find(t => t.id === taskId)
    if (task) {
      task.time.completed = Date.now()
      if (error) task.error = error

      // Check if we should retry
      if (task.attempts < session.config.maxRetries) {
        task.status = "pending" // Reset to pending for retry
        log.info("Task failed, will retry", { taskId, attempts: task.attempts, maxRetries: session.config.maxRetries })
      } else {
        task.status = "failed"
        log.error("Task failed after max retries", { taskId, error })

        if (session.config.stopOnError) {
          session.status = "failed"
          session.time.completed = Date.now()
        } else {
          // Move to next task
          const nextIndex = session.tasks.findIndex((t, i) =>
            i > session.currentTaskIndex && t.status === "pending"
          )
          if (nextIndex === -1) {
            session.status = "completed"
            session.time.completed = Date.now()
          } else {
            session.currentTaskIndex = nextIndex
          }
        }
      }
    }

    await save(worktree, session)
    return session
  }

  export async function pause(worktree: string, session: Session): Promise<Session> {
    session.status = "paused"
    await save(worktree, session)
    log.info("Bloxy session paused")
    return session
  }

  export async function resume(worktree: string, session: Session): Promise<Session> {
    if (session.status === "paused") {
      session.status = "running"
      await save(worktree, session)
      log.info("Bloxy session resumed")
    }
    return session
  }

  export function isComplete(session: Session): boolean {
    return session.status === "completed" || session.status === "failed"
  }

  export function shouldContinue(session: Session): boolean {
    return session.status === "running" && countRemaining(session) > 0
  }

  export function formatProgress(session: Session): string {
    const completed = countCompleted(session)
    const failed = countFailed(session)
    const total = session.tasks.length
    const current = getCurrentTask(session)

    if (current) {
      return `Task ${completed + 1}/${total}: ${current.title}${failed > 0 ? ` (${failed} failed)` : ""}`
    }
    return `${completed}/${total} tasks completed${failed > 0 ? `, ${failed} failed` : ""}`
  }
}
