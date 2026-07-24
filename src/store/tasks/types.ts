export type TodoId = string
export type ListId = string

export interface Todo {
  id: TodoId
  title: string
  isCompleted: boolean
  // The project this todo belongs to. Scheduling a todo onto the Today list
  // moves where it *shows*, never what it *belongs to* — this field only
  // changes when the todo is moved into a different project.
  projectId?: ListId
}

export type ListKind = "today" | "project"

export interface TaskList {
  id: ListId
  kind: ListKind
  name: string
  // Placement and order in one fact: a todo shows in exactly one list's
  // todoIds at a time.
  todoIds: TodoId[]
}

export interface TasksState {
  todosById: Record<TodoId, Todo>
  listsById: Record<ListId, TaskList>
  projectOrder: ListId[]
}

export const TODAY_LIST_ID: ListId = "today"
