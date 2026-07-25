import type { Db } from "../hooks"
import type { ListId } from "../schema"
import { editProject, selectProject } from "../ui-store"
import { asUndoStep } from "./undo"

// reorderProjects is a building block — the sidebar drag calls it on every
// dragover and seals the gesture itself. The rest are whole user actions and
// seal one undo step each. See ./undo.

// A new project starts unnamed — the caller drops the row straight into
// inline rename. An empty name renders as the "New Project" placeholder.
function addProject(db: Db): ListId {
  const id: ListId = `project-${crypto.randomUUID()}`
  const projectIds = db.indexes.getSliceRowIds("listsByKind", "project")
  const lastId = projectIds.at(-1)
  const position =
    lastId === undefined
      ? 1
      : (db.store.getCell("lists", lastId, "position") ?? 0) + 1
  db.store.setRow("lists", id, { kind: "project", name: "", position })
  return id
}

// The sidebar's counterpart to createTodoInPane: one step, so the new row is
// selected and already in inline rename on its first render.
export function createProject(db: Db) {
  asUndoStep(db, "New project", () => {
    const projectId = addProject(db)
    selectProject(projectId)
    editProject(projectId)
  })
}

export function renameProject(db: Db, projectId: ListId, name: string) {
  asUndoStep(db, "Rename project", () => {
    db.store.setCell("lists", projectId, "name", name)
  })
}

// The name is a key from ui/project-icons.ts, not a component: the document
// stores what the user chose, and each place that draws a project — the
// sidebar row, a task row in Today — decides how big to draw it.
export function setProjectIcon(db: Db, projectId: ListId, iconName: string) {
  asUndoStep(db, "Change project icon", () => {
    db.store.setCell("lists", projectId, "icon", iconName)
  })
}

// Deleting a project removes every todo that belongs to it, including todos
// currently scheduled onto Today — belonging is exclusive, so they have no
// other home.
export function deleteProject(db: Db, projectId: ListId) {
  asUndoStep(db, "Delete project", () => {
    db.store.getRowIds("todos").forEach((todoId) => {
      if (db.store.getCell("todos", todoId, "projectId") === projectId) {
        db.store.delRow("todos", todoId)
      }
    })
    db.store.delRow("lists", projectId)
  })
}

export function reorderProjects(db: Db, orderedIds: readonly ListId[]) {
  db.store.transaction(() => {
    orderedIds.forEach((listId, index) => {
      db.store.setCell("lists", listId, "position", index)
    })
  })
}
