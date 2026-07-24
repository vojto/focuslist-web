import { useLiveQuery } from "dexie-react-hooks"
import { db, type Todo } from "../db"

export function useTodos() {
  return useLiveQuery(() => db.todos.toArray(), [])
}

export async function toggleTodo(todo: Todo) {
  await db.todos.update(todo.id, { isCompleted: !todo.isCompleted })
}

export async function deleteTodo(todoId: number) {
  await db.todos.delete(todoId)
}
