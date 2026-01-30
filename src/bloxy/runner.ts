import { Instance } from "../project/instance"
import { Log } from "../util/log"
import { Bus } from "../bus"
import { BloxyState } from "./state"
import { BloxyParser } from "./parser"
import { BloxyPrompt } from "./prompt"
import { BloxyEvent } from "./event"

export namespace BloxyRunner {
  const log = Log.create({ service: "bloxy.runner" })

  /**
   * Get the effective worktree path, falling back to directory for non-git projects
   */
  function getWorktree(): string {
    return Instance.worktree === "/" ? Instance.directory : Instance.worktree
  }

  export interface StartOptions {
    prdPath: string
    sessionID: string
    config?: Partial<BloxyState.Config>
  }

  /**
   * Start a new Bloxy session by parsing the PRD and initializing state
   */
  export async function start(options: StartOptions): Promise<BloxyState.Session> {
    const worktree = getWorktree()

    // Check for existing session
    const existing = await BloxyState.load(worktree)
    if (existing && !BloxyState.isComplete(existing)) {
      log.info("Resuming existing session", { tasks: existing.tasks.length, current: existing.currentTaskIndex })
      return existing
    }

    // Parse PRD and create new session
    const result = await BloxyParser.parse({
      worktree,
      prdPath: options.prdPath,
      config: options.config,
    })

    if (result.tasks.length === 0) {
      throw new Error(`No tasks found in PRD file: ${options.prdPath}`)
    }

    const session = BloxyParser.createSession(result)
    session.status = "running"
    session.time.started = Date.now()

    await BloxyState.save(worktree, session)

    // Publish start event
    await Bus.publish(BloxyEvent.SessionStart, {
      sessionID: options.sessionID,
      prdPath: result.prdPath,
      taskCount: result.tasks.length,
    })

    log.info("Started Bloxy session", { tasks: session.tasks.length, prdPath: result.prdPath })

    return session
  }

  /**
   * Get the context message to inject for the current task
   */
  export async function getTaskContext(sessionID: string): Promise<string | null> {
    const worktree = getWorktree()
    const session = await BloxyState.load(worktree)

    if (!session) {
      return null
    }

    if (BloxyState.isComplete(session)) {
      return BloxyPrompt.buildCompletionSummary(session)
    }

    const task = BloxyState.getCurrentTask(session)
    if (!task) {
      return null
    }

    // Mark task as in progress if it's pending
    if (task.status === "pending") {
      await BloxyState.markInProgress(worktree, session, task.id)
    }

    return BloxyPrompt.buildTaskContext(session, task)
  }

  /**
   * Check if the session should continue to the next task
   */
  export async function shouldContinue(): Promise<boolean> {
    const worktree = getWorktree()
    const session = await BloxyState.load(worktree)

    if (!session) {
      return false
    }

    return BloxyState.shouldContinue(session)
  }

  /**
   * Complete the session and clean up
   */
  export async function complete(sessionID: string): Promise<void> {
    const worktree = getWorktree()
    const session = await BloxyState.load(worktree)

    if (!session) {
      return
    }

    const completed = BloxyState.countCompleted(session)
    const failed = BloxyState.countFailed(session)
    const total = session.tasks.length

    // Publish completion event
    await Bus.publish(BloxyEvent.SessionComplete, {
      sessionID,
      completed,
      failed,
      total,
    })

    log.info("Bloxy session complete", { completed, failed, total })

    // Update PRD file with completion markers
    for (const task of session.tasks) {
      if (task.status === "completed") {
        await BloxyParser.markTaskInFile(session.prdPath, task.title)
      }
    }
  }

  /**
   * Pause the current session
   */
  export async function pause(): Promise<void> {
    const worktree = getWorktree()
    const session = await BloxyState.load(worktree)

    if (session) {
      await BloxyState.pause(worktree, session)
    }
  }

  /**
   * Resume a paused session
   */
  export async function resume(): Promise<void> {
    const worktree = getWorktree()
    const session = await BloxyState.load(worktree)

    if (session) {
      await BloxyState.resume(worktree, session)
    }
  }

  /**
   * Stop the session completely
   */
  export async function stop(): Promise<void> {
    const worktree = getWorktree()
    await BloxyState.remove(worktree)
    log.info("Bloxy session stopped and removed")
  }

  /**
   * Get the current status for display
   */
  export async function getStatus(): Promise<{
    active: boolean
    session: BloxyState.Session | null
    statusLine: string
  }> {
    const worktree = getWorktree()
    const session = await BloxyState.load(worktree)

    if (!session) {
      return {
        active: false,
        session: null,
        statusLine: "No active Bloxy session",
      }
    }

    return {
      active: !BloxyState.isComplete(session),
      session,
      statusLine: BloxyPrompt.buildStatusLine(session),
    }
  }
}
