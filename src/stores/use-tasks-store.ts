import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  insertTodoIntoList,
  moveTodoToList,
  removeTodoFromLists,
} from "../lib/task-operations"
import type {
  ListId,
  ListsById,
  TaskList,
  Todo,
  TodoId,
  TodosById,
} from "../types"

export const TASKS_STORAGE_KEY = "focuslist-tasks"

export const TODAY_LIST_ID: ListId = "today"

export interface TasksState {
  todosById: TodosById
  listsById: ListsById
  projectOrder: ListId[]
}

interface TasksActions {
  addProject: (name: string) => ListId
  addTodo: (listId: ListId, title: string) => void
  deleteTodo: (todoId: TodoId) => void
  moveTodo: (todoId: TodoId, targetListId: ListId, index?: number) => void
  reorderProjects: (orderedIds: readonly ListId[]) => void
  toggleTodo: (todoId: TodoId) => void
  unscheduleTodo: (todoId: TodoId) => void
}

export type TasksStore = TasksState & TasksActions

const initialState: TasksState = {
  todosById: {},
  listsById: {
    [TODAY_LIST_ID]: {
      id: TODAY_LIST_ID,
      kind: "today",
      name: "Today",
      todoIds: [],
    },
  },
  projectOrder: [],
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set) => ({
      ...initialState,

      addProject: (name) => {
        const id: ListId = `project-${crypto.randomUUID()}`
        const list: TaskList = { id, kind: "project", name, todoIds: [] }
        set((state) => ({
          listsById: { ...state.listsById, [id]: list },
          projectOrder: [...state.projectOrder, id],
        }))
        return id
      },

      addTodo: (listId, title) =>
        set((state) => {
          const list = state.listsById[listId]
          if (list === undefined) {
            return state
          }
          const todo: Todo = {
            id: `todo-${crypto.randomUUID()}`,
            title,
            isCompleted: false,
            ...(list.kind === "project" ? { projectId: listId } : {}),
          }
          return {
            todosById: { ...state.todosById, [todo.id]: todo },
            listsById: insertTodoIntoList(state.listsById, listId, todo.id),
          }
        }),

      deleteTodo: (todoId) =>
        set((state) => {
          if (state.todosById[todoId] === undefined) {
            return state
          }
          return {
            todosById: Object.fromEntries(
              Object.entries(state.todosById).filter(([id]) => id !== todoId),
            ),
            listsById: removeTodoFromLists(state.listsById, todoId),
          }
        }),

      moveTodo: (todoId, targetListId, index) =>
        set((state) => moveTodoToList(state, todoId, targetListId, index)),

      reorderProjects: (orderedIds) => set({ projectOrder: [...orderedIds] }),

      toggleTodo: (todoId) =>
        set((state) => {
          const todo = state.todosById[todoId]
          if (todo === undefined) {
            return state
          }
          return {
            todosById: {
              ...state.todosById,
              [todoId]: { ...todo, isCompleted: !todo.isCompleted },
            },
          }
        }),

      unscheduleTodo: (todoId) =>
        set((state) => {
          const projectId = state.todosById[todoId]?.projectId
          if (projectId === undefined) {
            return state
          }
          return moveTodoToList(state, todoId, projectId)
        }),
    }),
    {
      name: TASKS_STORAGE_KEY,
      partialize: ({ listsById, projectOrder, todosById }) => ({
        listsById,
        projectOrder,
        todosById,
      }),
      version: 1,
    },
  ),
)

export function useList(listId: ListId | undefined): TaskList | undefined {
  return useTasksStore((state) =>
    listId === undefined ? undefined : state.listsById[listId],
  )
}

export function useListTodos(listId: ListId | undefined): Todo[] | undefined {
  const todoIds = useTasksStore((state) =>
    listId === undefined ? undefined : state.listsById[listId]?.todoIds,
  )
  const todosById = useTasksStore((state) => state.todosById)
  return todoIds
    ?.map((id) => todosById[id])
    .filter((todo): todo is Todo => todo !== undefined)
}

export function useProjects(): TaskList[] {
  const projectOrder = useTasksStore((state) => state.projectOrder)
  const listsById = useTasksStore((state) => state.listsById)
  return projectOrder
    .map((id) => listsById[id])
    .filter((list): list is TaskList => list !== undefined)
}
