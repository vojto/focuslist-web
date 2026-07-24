import { useLiveQuery } from "dexie-react-hooks"
import { db, type Todo } from "../db"

export function useTodayTodos() {
  return useLiveQuery(
    () => db.todos.filter((todo) => todo.isToday).toArray(),
    [],
  )
}

// Tasks that are both in a project and set for today are shown only on the
// Today list, so the project view excludes them.
export function useProjectTodos(projectId: number | undefined) {
  return useLiveQuery(async () => {
    if (projectId === undefined) {
      return undefined
    }
    return db.todos
      .where("projectId")
      .equals(projectId)
      .filter((todo) => !todo.isToday)
      .toArray()
  }, [projectId])
}

export async function createTodo(
  title: string,
  {
    projectId,
    isToday = false,
  }: { projectId?: number; isToday?: boolean } = {},
) {
  await db.todos.add({ title, isCompleted: false, isToday, projectId })
}

export async function toggleTodo(todo: Todo) {
  await db.todos.update(todo.id, { isCompleted: !todo.isCompleted })
}

export async function deleteTodo(todoId: number) {
  await db.todos.delete(todoId)
}
