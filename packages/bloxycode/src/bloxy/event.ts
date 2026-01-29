import z from "zod"
import { BusEvent } from "../bus/bus-event"

export namespace BloxyEvent {
  export const TaskComplete = BusEvent.define(
    "bloxy.task.complete",
    z.object({
      sessionID: z.string(),
      taskId: z.string(),
      summary: z.string().optional(),
    })
  )

  export const TaskFailed = BusEvent.define(
    "bloxy.task.failed",
    z.object({
      sessionID: z.string(),
      taskId: z.string(),
      error: z.string().optional(),
    })
  )

  export const SessionStart = BusEvent.define(
    "bloxy.session.start",
    z.object({
      sessionID: z.string(),
      prdPath: z.string(),
      taskCount: z.number(),
    })
  )

  export const SessionComplete = BusEvent.define(
    "bloxy.session.complete",
    z.object({
      sessionID: z.string(),
      completed: z.number(),
      failed: z.number(),
      total: z.number(),
    })
  )
}
