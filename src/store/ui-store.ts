import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ListId, PaneId, TodoId } from "./schema"

// Everything about how the app currently looks, kept deliberately outside
// TinyBase. The TinyBase store holds the document — two tables — and its
// checkpoints therefore record document history and nothing else, which is
// the whole reason undo can be six one-line functions: there is no selection
// or column width in a checkpoint to travel back to.
//
// Two lifetimes live here. Layout and the open project are the app's chrome
// and persist under their own key; the selection and edit pairs are session
// state that simply is not persisted — reopening the app should not restore
// a highlighted row or a half-typed title.
//
// A todo's selection and edit mode are each an id/pane pair, so two panes can
// never both claim one; projects need no pane, there being one project list.
// Every pair resolves through the store, so a stale one — the row was
// deleted, the pane now shows another list — is inert and needs no cleanup.

interface UiState {
  // Chrome (persisted).
  sidebarWidth: number
  projectWidth: number | undefined
  selectedProjectId: ListId | undefined
  // Session (not persisted).
  selectedTodoId: TodoId | undefined
  selectedTodoPaneId: PaneId | undefined
  editingTodoId: TodoId | undefined
  editingTodoPaneId: PaneId | undefined
  editingProjectId: ListId | undefined
}

const INITIAL_UI_STATE: UiState = {
  sidebarWidth: 224,
  projectWidth: undefined,
  selectedProjectId: undefined,
  selectedTodoId: undefined,
  selectedTodoPaneId: undefined,
  editingTodoId: undefined,
  editingTodoPaneId: undefined,
  editingProjectId: undefined,
}

export const useUiStore = create<UiState>()(
  persist(() => INITIAL_UI_STATE, {
    name: "focuslist-ui",
    partialize: ({ sidebarWidth, projectWidth, selectedProjectId }) => ({
      sidebarWidth,
      projectWidth,
      selectedProjectId,
    }),
  }),
)

// For the operations layer, which reads this state outside React.
export function uiState(): UiState {
  return useUiStore.getState()
}

// The writers. Plain functions rather than state members: components reach
// them without subscribing, and the operations layer without a hook.

export function selectTodo(todoId: TodoId, paneId: PaneId) {
  useUiStore.setState({ selectedTodoId: todoId, selectedTodoPaneId: paneId })
}

export function clearTodoSelection() {
  useUiStore.setState({
    selectedTodoId: undefined,
    selectedTodoPaneId: undefined,
  })
}

export function editTodo(todoId: TodoId, paneId: PaneId) {
  useUiStore.setState({ editingTodoId: todoId, editingTodoPaneId: paneId })
}

export function stopEditingTodo() {
  useUiStore.setState({
    editingTodoId: undefined,
    editingTodoPaneId: undefined,
  })
}

export function selectProject(projectId: ListId | undefined) {
  useUiStore.setState({ selectedProjectId: projectId })
}

export function editProject(projectId: ListId | undefined) {
  useUiStore.setState({ editingProjectId: projectId })
}

export function setSidebarWidth(width: number) {
  useUiStore.setState({ sidebarWidth: width })
}

export function setProjectWidth(width: number) {
  useUiStore.setState({ projectWidth: width })
}
