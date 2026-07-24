import Dexie, { type EntityTable } from "dexie"

export interface Todo {
  id: number
  title: string
  isCompleted: boolean
  isToday: boolean
  projectId?: number
}

export interface Project {
  id: number
  name: string
  order: number
}

export const db = new Dexie("focuslist") as Dexie & {
  todos: EntityTable<Todo, "id">
  projects: EntityTable<Project, "id">
}

db.version(1).stores({
  todos: "++id",
})

db.version(2).stores({
  todos: "++id, projectId",
  projects: "++id",
})

db.version(3)
  .stores({
    todos: "++id, projectId",
    projects: "++id, order",
  })
  .upgrade(async (tx) => {
    let order = 0
    await tx
      .table("projects")
      .toCollection()
      .modify((project: Project) => {
        project.order = order++
      })
  })

db.version(4)
  .stores({
    todos: "++id, projectId",
    projects: "++id, order",
  })
  .upgrade(async (tx) => {
    // Todos predating isToday were all shown on the Today list.
    await tx
      .table("todos")
      .toCollection()
      .modify((todo: Todo) => {
        todo.isToday = true
      })
  })
