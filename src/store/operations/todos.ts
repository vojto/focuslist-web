import type { Db } from "../hooks"
import { itemTypeOf } from "../item-type"
import type { ListId, PaneId, TodoId } from "../schema"
import { moveSelectionOff, moveSelectionOffSpan } from "./selection"
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
    type: "task",
    title: "",
    isCompleted: false,
    listId,
    position: insertPosition(db, listId),
    ...(kind === "project" ? { projectId: listId } : {}),
  })
  return id
}

// A section is a heading in the row order, nothing more: the tasks under it
// are the rows between it and the next heading. So it carries no membership
// of its own — no projectId to keep in step, and nothing to update when a
// task is dragged across it. It starts unnamed like every other row the app
// creates, and the caller drops it straight into inline rename.
export function addSection(db: Db, listId: ListId): TodoId {
  if (db.store.getCell("lists", listId, "kind") === undefined) {
    throw new Error(`Cannot add a section to unknown list ${listId}`)
  }
  const id: TodoId = `section-${crypto.randomUUID()}`
  db.store.setRow("todos", id, {
    type: "section",
    title: "",
    listId,
    position: insertPosition(db, listId),
  })
  return id
}

// A section and the tasks under it, in order — the only place that has to
// know membership is positional. Callers that mean "this heading and
// everything it covers" ask here rather than walking the list themselves.
export function sectionSpan(db: Db, sectionId: TodoId): readonly TodoId[] {
  const listId = db.store.getCell("todos", sectionId, "listId")
  if (listId === undefined) {
    return []
  }
  const ids = todoIdsIn(db, listId)
  const start = ids.indexOf(sectionId)
  if (start === -1) {
    return []
  }
  const below = ids.slice(start + 1)
  const nextSection = below.findIndex(
    (todoId) => itemTypeOf(db, todoId) === "section",
  )
  return [
    sectionId,
    ...(nextSection === -1 ? below : below.slice(0, nextSection)),
  ]
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

// The section counterpart, and the same bargain: one step, so the heading's
// first render is already in inline rename.
export function createSectionInPane(db: Db, listId: ListId, paneId: PaneId) {
  asUndoStep(db, "New section", () => {
    editTodo(addSection(db, listId), paneId)
  })
}

// The two text writes the task editor makes. They are building blocks like
// moveTodo: the editor writes on every keystroke so nothing is ever held only
// in a textarea, and seals the whole stretch of typing as one step when the
// field is left (see ./undo). A row rename is a whole action and seals itself.
export function setTodoTitle(db: Db, todoId: TodoId, title: string) {
  db.store.setCell("todos", todoId, "title", title)
}

export function setTodoNotes(db: Db, todoId: TodoId, notes: string) {
  db.store.setCell("todos", todoId, "notes", notes)
}

// Both kinds of row rename through here, and the undo step is labelled with
// the one that actually changed — the menu saying "Undo rename task" over a
// heading would name the wrong thing.
export function renameTodo(db: Db, todoId: TodoId, title: string) {
  const isSection = itemTypeOf(db, todoId) === "section"
  asUndoStep(db, isSection ? "Rename section" : "Rename task", () => {
    setTodoTitle(db, todoId, title)
  })
}

// The key of an option in ui/task-estimates.ts, or the empty string for no
// estimate at all — which is the cell being gone rather than a key that means
// nothing, so the catalog never needs an entry standing for "unestimated".
export function setTodoEstimate(db: Db, todoId: TodoId, estimate: string) {
  asUndoStep(db, "Change estimate", () => {
    if (estimate === "") {
      db.store.delCell("todos", todoId, "estimate")
    } else {
      db.store.setCell("todos", todoId, "estimate", estimate)
    }
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
  const isSection = itemTypeOf(db, todoId) === "section"
  asUndoStep(db, isSection ? "Delete section" : "Delete task", () => {
    moveSelectionOff(db, todoId)
    db.store.delRow("todos", todoId)
  })
}

// Deleting a heading on its own leaves its tasks where they are — they merge
// upward into the section above, which is what membership being positional
// means. This is the other thing a menu can ask for: the heading and
// everything under it, gone together.
export function deleteSectionWithTasks(db: Db, sectionId: TodoId) {
  const span = sectionSpan(db, sectionId)
  asUndoStep(db, "Delete section and tasks", () => {
    moveSelectionOffSpan(db, span)
    span.forEach((todoId) => {
      db.store.delRow("todos", todoId)
    })
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
    // Only a task belongs to a project. A section is a heading in one list's
    // order and belongs to nothing, so moving it never stamps one on.
    if (targetKind === "project" && itemTypeOf(db, todoId) === "task") {
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
