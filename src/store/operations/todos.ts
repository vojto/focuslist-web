import type { Db } from "../hooks"
import type { ListId, TodoId } from "../schema"

function todoIdsIn(db: Db, listId: ListId): readonly string[] {
  return db.indexes.getSliceRowIds("todosByList", listId)
}

function positionOf(db: Db, todoId: string): number {
  return db.store.getCell("todos", todoId, "position") ?? 0
}

// Fractional positioning: dropping between two todos takes their midpoint, so
// inserts never renumber neighbors.
function insertPosition(
  db: Db,
  listId: ListId,
  index?: number,
  excludeTodoId?: TodoId,
): number {
  const ids = todoIdsIn(db, listId).filter((id) => id !== excludeTodoId)
  const nextId = index === undefined ? undefined : ids[index]
  if (index === undefined || nextId === undefined) {
    const lastId = ids.at(-1)
    return lastId === undefined ? 1 : positionOf(db, lastId) + 1
  }
  const next = positionOf(db, nextId)
  const previousId = ids[index - 1]
  return previousId === undefined
    ? next - 1
    : (positionOf(db, previousId) + next) / 2
}

// A new todo starts untitled at the end of the list — the caller drops it
// straight into inline editing, and an empty title renders as the "New Task"
// placeholder. Returns undefined when the list does not exist.
export function addTodo(db: Db, listId: ListId): TodoId | undefined {
  const kind = db.store.getCell("lists", listId, "kind")
  if (kind === undefined) {
    return undefined
  }
  const id: TodoId = `todo-${crypto.randomUUID()}`
  db.store.setRow("todos", id, {
    title: "",
    isCompleted: false,
    listId,
    position: insertPosition(db, listId),
    ...(kind === "project" ? { projectId: listId } : {}),
  })
  return id
}

export function renameTodo(db: Db, todoId: TodoId, title: string) {
  db.store.setCell("todos", todoId, "title", title)
}

// Moves a todo into a list at the given position (append when omitted).
// Moving into a project reassigns belonging (projectId); moving onto Today
// only changes placement — the todo still belongs to its project.
export function moveTodo(
  db: Db,
  todoId: TodoId,
  targetListId: ListId,
  index?: number,
) {
  const targetKind = db.store.getCell("lists", targetListId, "kind")
  if (targetKind === undefined || !db.store.hasRow("todos", todoId)) {
    return
  }
  const position = insertPosition(db, targetListId, index, todoId)
  db.store.transaction(() => {
    db.store.setCell("todos", todoId, "listId", targetListId)
    db.store.setCell("todos", todoId, "position", position)
    if (targetKind === "project") {
      db.store.setCell("todos", todoId, "projectId", targetListId)
    }
  })
}

export function unscheduleTodo(db: Db, todoId: TodoId) {
  const projectId = db.store.getCell("todos", todoId, "projectId")
  if (projectId !== undefined) {
    moveTodo(db, todoId, projectId)
  }
}
