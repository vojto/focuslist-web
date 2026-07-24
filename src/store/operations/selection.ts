import type { Db } from "../hooks"
import type { Pane, PaneId, TodoId } from "../schema"
import { clearTodoSelection, selectTodo, uiState } from "../ui-store"

// Which todo the app is pointing at, and every rule for where that pointer
// goes next. ui-store.ts owns the two values; this module owns what they
// mean — reading them resolved (a selection naming a deleted row is no
// selection), and moving them by row, by pane, or out of the way of a
// deletion.
//
// The rules live here rather than in the keyboard layer because none of them
// are about keys: a menu item, a command palette or a gesture that deletes a
// task needs the same answer for "what is selected now?". Panes come in as
// an argument because their left-to-right order is the one thing about the
// screen the store does not know.

export interface SelectedTodo {
  todoId: TodoId
  paneId: PaneId
}

// The selection, resolved: undefined unless both halves are set and the row
// is still there. Callers never have to ask whether the id went stale, and a
// selection left over from a deleted row reads as "nothing selected" — which
// is what sends the next arrow key back to the top of a list instead of
// nowhere.
export function selectedTodo(db: Db): SelectedTodo | undefined {
  const { selectedTodoId: todoId, selectedTodoPaneId: paneId } = uiState()
  if (
    todoId === undefined ||
    paneId === undefined ||
    !db.store.hasRow("todos", todoId)
  ) {
    return undefined
  }
  return { todoId, paneId }
}

// The pane a task action works in: the one holding the selection, or the
// leftmost pane when nothing is selected — or when the selection sits in a
// pane that is no longer on screen.
export function activePane(panes: readonly Pane[]): Pane | undefined {
  const { selectedTodoPaneId } = uiState()
  return panes.find((pane) => pane.paneId === selectedTodoPaneId) ?? panes[0]
}

// Where a todo sits: the row order of the list holding it, and its place in
// that order. The list follows from the todo itself — a row only renders in
// the pane showing its list — so no caller has to be told which list it is
// working in.
function locate(db: Db, todoId: TodoId) {
  const listId = db.store.getCell("todos", todoId, "listId")
  if (listId === undefined) {
    return undefined
  }
  const todoIds = db.indexes.getSliceRowIds("todosByList", listId)
  return { index: todoIds.indexOf(todoId), todoIds }
}

// With nothing selected the selection enters at the leftmost pane, from the
// end it is heading for: forward lands on the first todo, backward on the
// last. An empty pane is skipped rather than swallowing the move — with no
// project selected, or an empty project, that lands on Today.
function selectEdgeTodo(db: Db, panes: readonly Pane[], offset: number) {
  for (const pane of panes) {
    const todoIds = db.indexes.getSliceRowIds("todosByList", pane.listId)
    const todoId = offset > 0 ? todoIds[0] : todoIds.at(-1)
    if (todoId !== undefined) {
      selectTodo(todoId, pane.paneId)
      return
    }
  }
}

// Moves the selection by `offset` rows within its own list. At either end of
// the list it stays put.
export function moveSelection(db: Db, panes: readonly Pane[], offset: number) {
  const selected = selectedTodo(db)
  if (selected === undefined) {
    selectEdgeTodo(db, panes, offset)
    return
  }
  const location = locate(db, selected.todoId)
  const nextTodoId = location?.todoIds[location.index + offset]
  if (nextTodoId !== undefined) {
    selectTodo(nextTodoId, selected.paneId)
  }
}

// Moves the selection one pane sideways, holding its place in the list: the
// same row number, or the last row when the pane it lands in is shorter.
// An empty or missing pane is left alone.
export function moveSelectionToPane(
  db: Db,
  panes: readonly Pane[],
  offset: number,
) {
  const selected = selectedTodo(db)
  if (selected === undefined) {
    selectEdgeTodo(db, panes, 1)
    return
  }
  const targetPane =
    panes[panes.findIndex((pane) => pane.paneId === selected.paneId) + offset]
  if (targetPane === undefined) {
    return
  }
  const todoIds = db.indexes.getSliceRowIds("todosByList", targetPane.listId)
  const rowIndex = locate(db, selected.todoId)?.index ?? 0
  const nextTodoId = todoIds[Math.min(rowIndex, todoIds.length - 1)]
  if (nextTodoId !== undefined) {
    selectTodo(nextTodoId, targetPane.paneId)
  }
}

// Steps the selection off a todo that is about to be removed, onto the row
// that will slide up into its place — or the one above it when it was last.
// Deletion calls this, so it holds however the delete was triggered; a
// selection left naming the deleted row would take the highlight off screen
// and leave the arrow keys with nowhere to start from.
export function moveSelectionOff(db: Db, todoId: TodoId) {
  const selected = selectedTodo(db)
  if (selected?.todoId !== todoId) {
    return
  }
  const location = locate(db, todoId)
  const successorId =
    location === undefined
      ? undefined
      : (location.todoIds[location.index + 1] ??
        location.todoIds[location.index - 1])
  if (successorId === undefined) {
    clearTodoSelection()
  } else {
    selectTodo(successorId, selected.paneId)
  }
}
