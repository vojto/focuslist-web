import type { Db } from "../hooks"
import type { ListId, PaneId, TodoId } from "../schema"
import { moveSelectionOff } from "./selection"
import { editTodo } from "../ui-store"
import { asUndoStep } from "./undo"

// addTodo and moveTodo are building blocks: a drag calls moveTodo on every
// pointer move and seals the whole gesture as one step, so they must not seal
// one each. Everything else here is a whole user action and does. See ./undo.

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
// placeholder. Only a pane showing the list can ask for one, so a missing
// list is a bug rather than a case to handle.
export function addTodo(db: Db, listId: ListId): TodoId {
  const kind = db.store.getCell("lists", listId, "kind")
  if (kind === undefined) {
    throw new Error(`Cannot add a todo to unknown list ${listId}`)
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

// Creating a task is always "creating and naming it": one step, so the new
// row's first render is already in edit mode and no untitled row flashes
// past. Every entry point — the toolbar, the pane menu, the keyboard — goes
// through here, which is what keeps them from drifting apart.
export function createTodoInPane(db: Db, listId: ListId, paneId: PaneId) {
  asUndoStep(db, "New task", () => {
    editTodo(addTodo(db, listId), paneId)
  })
}

export function renameTodo(db: Db, todoId: TodoId, title: string) {
  asUndoStep(db, "Rename task", () => {
    db.store.setCell("todos", todoId, "title", title)
  })
}

export function toggleTodoCompletion(db: Db, todoId: TodoId) {
  asUndoStep(db, "Complete task", () => {
    db.store.setCell(
      "todos",
      todoId,
      "isCompleted",
      (wasCompleted) => wasCompleted !== true,
    )
  })
}

// Stepping the selection off the row is part of deleting it, not part of the
// keyboard: the row menu deletes too, and it would otherwise leave the
// selection naming a row that no longer exists. Undo brings the task back
// without moving the selection again — it is session state, which undo holds
// still (see ./undo).
export function deleteTodo(db: Db, todoId: TodoId) {
  asUndoStep(db, "Delete task", () => {
    moveSelectionOff(db, todoId)
    db.store.delRow("todos", todoId)
  })
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
    asUndoStep(db, "Unschedule task", () => {
      moveTodo(db, todoId, projectId)
    })
  }
}
