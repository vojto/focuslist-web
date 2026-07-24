import type { Db } from "../hooks"
import type { ListId } from "../schema"

// A new project starts unnamed — the caller drops the row straight into
// inline rename. An empty name renders as the "New Project" placeholder.
export function addProject(db: Db): ListId {
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

export function renameProject(db: Db, projectId: ListId, name: string) {
  db.store.setCell("lists", projectId, "name", name)
}

// Deleting a project removes every todo that belongs to it, including todos
// currently scheduled onto Today — belonging is exclusive, so they have no
// other home.
export function deleteProject(db: Db, projectId: ListId) {
  db.store.transaction(() => {
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
