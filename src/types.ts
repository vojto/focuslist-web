export type TodoId = string
export type ListId = string

// A todo. `projectId` is the project this todo belongs to — scheduling a
// todo onto the Today list moves where it *shows*, never what it *belongs
// to*; this field only changes when the todo is moved into another project.
export interface Todo {
  id: TodoId
  title: string
  isCompleted: boolean
  projectId?: ListId
}

export type ListKind = "today" | "project"

// A task list. Placement and order are one fact: a todo shows in exactly one
// list's todoIds at a time.
export interface TaskList {
  id: ListId
  kind: ListKind
  name: string
  todoIds: TodoId[]
}

export type TodosById = Record<TodoId, Todo>
export type ListsById = Record<ListId, TaskList>
