import type { Db } from "./hooks"
import type { TodoId } from "./schema"

// Which of the two kinds of row a todo is. The `type` cell holds whatever
// some version of the app once wrote there, so reading it has to be allowed
// to miss — and an unrecognized row still has to draw as something rather
// than vanish. It resolves to a task, the same way projectIcon() resolves an
// unknown icon key and taskEstimate() an unknown estimate: absent and
// unrecognized answered in one place, so no caller re-derives the fallback.

export type ItemType = "task" | "section"

export function itemType(type: string | undefined): ItemType {
  return type === "section" ? "section" : "task"
}

// The same question asked of the document, for the operations layer — which
// reads rows by id rather than through a hook.
export function itemTypeOf(db: Db, todoId: TodoId): ItemType {
  return itemType(db.store.getCell("todos", todoId, "type"))
}
