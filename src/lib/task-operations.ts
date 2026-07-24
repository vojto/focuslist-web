import type { ListId, ListsById, TaskList, TodoId, TodosById } from "../types"

interface Tables {
  listsById: ListsById
  todosById: TodosById
}

export function findListOf(
  listsById: ListsById,
  todoId: TodoId,
): TaskList | undefined {
  return Object.values(listsById).find((list) => list.todoIds.includes(todoId))
}

// Returns the same reference when the todo isn't in any list.
export function removeTodoFromLists(
  listsById: ListsById,
  todoId: TodoId,
): ListsById {
  const list = findListOf(listsById, todoId)
  if (list === undefined) {
    return listsById
  }
  return {
    ...listsById,
    [list.id]: {
      ...list,
      todoIds: list.todoIds.filter((id) => id !== todoId),
    },
  }
}

export function insertTodoIntoList(
  listsById: ListsById,
  listId: ListId,
  todoId: TodoId,
  index?: number,
): ListsById {
  const list = listsById[listId]
  if (list === undefined) {
    return listsById
  }
  const todoIds = [...list.todoIds]
  const insertAt =
    index === undefined
      ? todoIds.length
      : Math.max(0, Math.min(index, todoIds.length))
  todoIds.splice(insertAt, 0, todoId)
  return { ...listsById, [listId]: { ...list, todoIds } }
}

// Moves a todo into a list at the given position (append when omitted).
// Moving into a project reassigns belonging (projectId); moving onto Today
// only changes placement — the todo still belongs to its project.
export function moveTodoToList(
  tables: Tables,
  todoId: TodoId,
  targetListId: ListId,
  index?: number,
): Tables {
  const todo = tables.todosById[todoId]
  const target = tables.listsById[targetListId]
  if (todo === undefined || target === undefined) {
    return tables
  }
  const listsById = insertTodoIntoList(
    removeTodoFromLists(tables.listsById, todoId),
    targetListId,
    todoId,
    index,
  )
  const todosById =
    target.kind === "project" && todo.projectId !== targetListId
      ? { ...tables.todosById, [todoId]: { ...todo, projectId: targetListId } }
      : tables.todosById
  return { listsById, todosById }
}
