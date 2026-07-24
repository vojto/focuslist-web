import { useCell, useDb } from "../../store/hooks"
import { toggleTodoCompletion } from "../../store/operations/todos"
import type { TodoId } from "../../store/schema"

// Read by both the row (for its menu) and the card (for its checkbox), each
// by id, so the two never disagree about what the checkbox shows.
export function useTodoCompletion(todoId: TodoId) {
  const db = useDb()
  const isCompleted = useCell("todos", todoId, "isCompleted") === true
  return {
    isCompleted,
    toggleTodo: () => {
      toggleTodoCompletion(db, todoId)
    },
  }
}
