import { BloxyState } from "./state"

export namespace BloxyPrompt {
  /**
   * Build the task context to inject into the session
   */
  export function buildTaskContext(session: BloxyState.Session, task: BloxyState.Task): string {
    const completed = BloxyState.countCompleted(session)
    const total = session.tasks.length
    const remaining = BloxyState.countRemaining(session)

    const parts: string[] = []

    parts.push("## Bloxy Autonomous Mode Active")
    parts.push("")
    parts.push(`**Progress**: Task ${completed + 1} of ${total} (${remaining} remaining)`)
    parts.push("")
    parts.push("---")
    parts.push("")
    parts.push(`## Current Task: ${task.title}`)

    if (task.body) {
      parts.push("")
      parts.push(task.body)
    }

    parts.push("")
    parts.push("---")
    parts.push("")
    parts.push("## Instructions")
    parts.push("")
    parts.push("1. **Implement** the task described above completely")

    let step = 2
    if (session.config.runTests && session.config.testCommand) {
      parts.push(`${step}. **Test** by running: \`${session.config.testCommand}\``)
      step++
    }

    if (session.config.lintCommand) {
      parts.push(`${step}. **Lint** by running: \`${session.config.lintCommand}\``)
      step++
    }

    if (session.config.autoCommit) {
      parts.push(`${step}. **Commit** your changes with a descriptive message`)
      step++
    }

    parts.push(`${step}. **Signal completion** using the \`bloxy_control\` tool with action "task_complete"`)

    parts.push("")
    parts.push("## Important")
    parts.push("")
    parts.push("- Focus ONLY on this task - do not work ahead")
    parts.push("- Keep changes focused and minimal")
    parts.push("- If you encounter an error you cannot resolve, use `bloxy_control` with action \"task_failed\"")
    parts.push("- Do NOT modify the PRD file directly")

    return parts.join("\n")
  }

  /**
   * Build completion summary for the session
   */
  export function buildCompletionSummary(session: BloxyState.Session): string {
    const completed = BloxyState.countCompleted(session)
    const failed = BloxyState.countFailed(session)
    const total = session.tasks.length

    const parts: string[] = []

    parts.push("## Bloxy Session Complete")
    parts.push("")
    parts.push(`**Results**: ${completed}/${total} tasks completed${failed > 0 ? `, ${failed} failed` : ""}`)
    parts.push("")

    if (completed > 0) {
      parts.push("### Completed Tasks")
      session.tasks.filter(t => t.status === "completed").forEach(t => {
        parts.push(`- [x] ${t.title}${t.summary ? `: ${t.summary}` : ""}`)
      })
      parts.push("")
    }

    if (failed > 0) {
      parts.push("### Failed Tasks")
      session.tasks.filter(t => t.status === "failed").forEach(t => {
        parts.push(`- [ ] ${t.title}${t.error ? `: ${t.error}` : ""}`)
      })
      parts.push("")
    }

    const duration = session.time.completed && session.time.started
      ? Math.round((session.time.completed - session.time.started) / 1000)
      : 0

    if (duration > 0) {
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      parts.push(`**Duration**: ${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`)
    }

    return parts.join("\n")
  }

  /**
   * Build the status display for the TUI
   */
  export function buildStatusLine(session: BloxyState.Session): string {
    const task = BloxyState.getCurrentTask(session)
    if (!task) {
      return BloxyState.formatProgress(session)
    }

    const completed = BloxyState.countCompleted(session)
    const total = session.tasks.length

    return `[${completed + 1}/${total}] ${task.title}`
  }
}
