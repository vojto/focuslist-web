import type { Db } from "../hooks"
import type { ListId, PaneId, TodoId } from "../schema"

// Session UI state: which row is selected, which row is being renamed. It
// lives in the store so panes, rows and keyboard commands all read the same
// answer, and is cleared on load (SESSION_VALUE_IDS) rather than persisted.
//
// Selection and editing are both an id paired with the pane it happened in,
// so one value pair per concern means two panes can never both claim it.

export function selectTodo(db: Db, todoId: TodoId, paneId: PaneId) {
  db.store.setPartialValues({
    selectedTodoId: todoId,
    selectedTodoPaneId: paneId,
  })
}

export function clearTodoSelection(db: Db) {
  db.store.transaction(() => {
    db.store.delValue("selectedTodoId")
    db.store.delValue("selectedTodoPaneId")
  })
}

export function editTodo(db: Db, todoId: TodoId, paneId: PaneId) {
  db.store.setPartialValues({
    editingTodoId: todoId,
    editingTodoPaneId: paneId,
  })
}

export function stopEditingTodo(db: Db) {
  db.store.transaction(() => {
    db.store.delValue("editingTodoId")
    db.store.delValue("editingTodoPaneId")
  })
}

// Projects need no pane: there is only one project list.
export function selectProject(db: Db, projectId: ListId | undefined) {
  if (projectId === undefined) {
    db.store.delValue("selectedProjectId")
  } else {
    db.store.setValue("selectedProjectId", projectId)
  }
}

export function editProject(db: Db, projectId: ListId | undefined) {
  if (projectId === undefined) {
    db.store.delValue("editingProjectId")
  } else {
    db.store.setValue("editingProjectId", projectId)
  }
}
