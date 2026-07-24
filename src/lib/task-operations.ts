import { db, indexes } from "../db"
import type { ListId, TodoId } from "../types"

function todoIdsIn(listId: ListId): readonly string[] {
  return indexes.getSliceRowIds("todosByList", listId)
}

function positionOf(todoId: string): number {
  return db.getCell("todos", todoId, "position") ?? 0
}

// Fractional positioning: dropping between two todos takes their midpoint, so
// inserts never renumber neighbors.
function insertPosition(
  listId: ListId,
  index?: number,
  excludeTodoId?: TodoId,
): number {
  const ids = todoIdsIn(listId).filter((id) => id !== excludeTodoId)
  const nextId = index === undefined ? undefined : ids[index]
  if (nextId === undefined) {
    const lastId = ids.at(-1)
    return lastId === undefined ? 1 : positionOf(lastId) + 1
  }
  const next = positionOf(nextId)
  const previousId = index === 0 ? undefined : ids[(index ?? 0) - 1]
  return previousId === undefined
    ? next - 1
    : (positionOf(previousId) + next) / 2
}

export function addTodo(listId: ListId, title: string) {
  const kind = db.getCell("lists", listId, "kind")
  if (kind === undefined) {
    return
  }
  db.setRow("todos", `todo-${crypto.randomUUID()}`, {
    title,
    isCompleted: false,
    listId,
    position: insertPosition(listId),
    ...(kind === "project" ? { projectId: listId } : {}),
  })
}

export function toggleTodo(todoId: TodoId) {
  db.setCell("todos", todoId, "isCompleted", (isCompleted) => !isCompleted)
}

export function deleteTodo(todoId: TodoId) {
  db.delRow("todos", todoId)
}

// Moves a todo into a list at the given position (append when omitted).
// Moving into a project reassigns belonging (projectId); moving onto Today
// only changes placement — the todo still belongs to its project.
export function moveTodo(todoId: TodoId, targetListId: ListId, index?: number) {
  const targetKind = db.getCell("lists", targetListId, "kind")
  if (targetKind === undefined || !db.hasRow("todos", todoId)) {
    return
  }
  const position = insertPosition(targetListId, index, todoId)
  db.transaction(() => {
    db.setCell("todos", todoId, "listId", targetListId)
    db.setCell("todos", todoId, "position", position)
    if (targetKind === "project") {
      db.setCell("todos", todoId, "projectId", targetListId)
    }
  })
}

export function unscheduleTodo(todoId: TodoId) {
  const projectId = db.getCell("todos", todoId, "projectId")
  if (projectId !== undefined) {
    moveTodo(todoId, projectId)
  }
}

export function addProject(name: string): ListId {
  const id: ListId = `project-${crypto.randomUUID()}`
  const projectIds = indexes.getSliceRowIds("listsByKind", "project")
  const lastId = projectIds.at(-1)
  const position =
    lastId === undefined
      ? 1
      : (db.getCell("lists", lastId, "position") ?? 0) + 1
  db.setRow("lists", id, { kind: "project", name, position })
  return id
}

export function reorderProjects(orderedIds: readonly ListId[]) {
  db.transaction(() => {
    orderedIds.forEach((listId, index) => {
      db.setCell("lists", listId, "position", index)
    })
  })
}
