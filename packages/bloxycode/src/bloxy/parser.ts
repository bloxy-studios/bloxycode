import fs from "fs/promises"
import path from "path"
import { BloxyState } from "./state"
import { Log } from "../util/log"

export namespace BloxyParser {
  const log = Log.create({ service: "bloxy.parser" })

  export interface ParseOptions {
    worktree: string
    prdPath: string
    config?: Partial<BloxyState.Config>
  }

  export interface ParseResult {
    tasks: BloxyState.Task[]
    config: BloxyState.Config
    prdPath: string
  }

  /**
   * Parse a PRD file and extract tasks
   * Supports markdown with checkbox format: `- [ ] task title`
   */
  export async function parse(options: ParseOptions): Promise<ParseResult> {
    const filepath = path.isAbsolute(options.prdPath)
      ? options.prdPath
      : path.join(options.worktree, options.prdPath)

    const content = await fs.readFile(filepath, "utf-8")
    const ext = path.extname(filepath).toLowerCase()

    let tasks: BloxyState.Task[]

    if (ext === ".yaml" || ext === ".yml") {
      tasks = parseYaml(content)
    } else if (ext === ".json") {
      tasks = parseJson(content)
    } else {
      // Default to markdown
      tasks = parseMarkdown(content)
    }

    log.info("Parsed PRD", { path: filepath, tasks: tasks.length })

    return {
      tasks,
      config: BloxyState.Config.parse(options.config ?? {}),
      prdPath: filepath,
    }
  }

  /**
   * Parse markdown PRD with checkbox format
   * Supports:
   * - [ ] task title
   * - [x] completed task (skipped)
   * ## Task: title
   */
  function parseMarkdown(content: string): BloxyState.Task[] {
    const tasks: BloxyState.Task[] = []
    const lines = content.split("\n")

    let currentTask: Partial<BloxyState.Task> | null = null
    let bodyLines: string[] = []
    let taskIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for checkbox format: - [ ] task or - [x] task
      const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)$/)
      if (checkboxMatch) {
        // Save previous task
        if (currentTask) {
          currentTask.body = bodyLines.join("\n").trim() || undefined
          tasks.push(BloxyState.Task.parse(currentTask))
        }

        const isCompleted = checkboxMatch[1].toLowerCase() === "x"
        const title = checkboxMatch[2].trim()

        if (!isCompleted) {
          taskIndex++
          currentTask = {
            id: `task-${taskIndex}`,
            title,
            status: "pending",
            attempts: 0,
            time: {},
          }
          bodyLines = []
        } else {
          currentTask = null
          bodyLines = []
        }
        continue
      }

      // Check for header format: ## Task: title or ### title
      const headerMatch = line.match(/^#{1,3}\s*(?:Task\s*[:.]?\s*)?(.+)$/)
      if (headerMatch && !line.startsWith("####")) {
        // Save previous task
        if (currentTask) {
          currentTask.body = bodyLines.join("\n").trim() || undefined
          tasks.push(BloxyState.Task.parse(currentTask))
        }

        // Check if this header looks like a task (not just a section like "Overview")
        const title = headerMatch[1].trim()
        const skipHeaders = ["overview", "summary", "introduction", "tasks", "context", "requirements", "notes"]
        if (skipHeaders.some(h => title.toLowerCase() === h)) {
          currentTask = null
          bodyLines = []
          continue
        }

        taskIndex++
        currentTask = {
          id: `task-${taskIndex}`,
          title,
          status: "pending",
          attempts: 0,
          time: {},
        }
        bodyLines = []
        continue
      }

      // Accumulate body content for current task
      if (currentTask) {
        bodyLines.push(line)
      }
    }

    // Save last task
    if (currentTask) {
      currentTask.body = bodyLines.join("\n").trim() || undefined
      tasks.push(BloxyState.Task.parse(currentTask))
    }

    return tasks
  }

  /**
   * Parse YAML PRD format
   * Expected format:
   * tasks:
   *   - title: "task title"
   *     body: "optional description"
   */
  function parseYaml(content: string): BloxyState.Task[] {
    // Simple YAML parser for task lists
    // For full YAML support, could use a library
    const tasks: BloxyState.Task[] = []

    // Match tasks array entries
    const taskRegex = /^\s*-\s*title:\s*["']?(.+?)["']?\s*$/gm
    let match
    let index = 0

    while ((match = taskRegex.exec(content)) !== null) {
      index++
      tasks.push(BloxyState.Task.parse({
        id: `task-${index}`,
        title: match[1].trim(),
        status: "pending",
        attempts: 0,
        time: {},
      }))
    }

    return tasks
  }

  /**
   * Parse JSON PRD format
   * Expected format:
   * {
   *   "tasks": [
   *     { "title": "task title", "body": "optional" }
   *   ]
   * }
   */
  function parseJson(content: string): BloxyState.Task[] {
    const data = JSON.parse(content)
    const tasks: BloxyState.Task[] = []

    if (!data.tasks || !Array.isArray(data.tasks)) {
      throw new Error("JSON PRD must have a 'tasks' array")
    }

    data.tasks.forEach((item: { title?: string; body?: string; completed?: boolean }, index: number) => {
      if (!item.title) return
      if (item.completed) return // Skip completed tasks

      tasks.push(BloxyState.Task.parse({
        id: `task-${index + 1}`,
        title: item.title,
        body: item.body,
        status: "pending",
        attempts: 0,
        time: {},
      }))
    })

    return tasks
  }

  /**
   * Create a BloxyState.Session from parsed results
   */
  export function createSession(result: ParseResult): BloxyState.Session {
    return BloxyState.Session.parse({
      tasks: result.tasks,
      currentTaskIndex: 0,
      prdPath: result.prdPath,
      config: result.config,
      status: "idle",
      time: {},
    })
  }

  /**
   * Update the original PRD file to mark a task as complete
   */
  export async function markTaskInFile(filepath: string, taskTitle: string): Promise<void> {
    try {
      const content = await fs.readFile(filepath, "utf-8")
      const ext = path.extname(filepath).toLowerCase()

      if (ext === ".md") {
        // Replace - [ ] with - [x] for the matching task
        const escaped = taskTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const updated = content.replace(
          new RegExp(`^([-*]\\s*)\\[[ ]\\](\\s*${escaped})`, "m"),
          "$1[x]$2"
        )
        if (updated !== content) {
          await fs.writeFile(filepath, updated)
          log.info("Marked task complete in PRD", { task: taskTitle })
        }
      }
      // YAML and JSON don't have built-in completion markers in the same way
    } catch (e) {
      log.error("Failed to update PRD file", { error: e })
    }
  }
}
