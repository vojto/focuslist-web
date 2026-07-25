import { DragDropProvider } from "@dnd-kit/react"
import NoProjectPane from "../components/panes/no-project-pane"
import TaskEditorPane from "../components/panes/task-editor-pane"
import TaskListPane from "../components/panes/task-list-pane"
import Sidebar from "../components/sidebar/sidebar"
import { useTaskDnd } from "../components/task-list/use-task-dnd"
import { useOpenTodoId } from "../hooks/use-open-todo"
import { useSelectedProjectId } from "../hooks/use-selected-project"
import { useKeyboard } from "../keyboard/use-keyboard"
import { useCell } from "../store/hooks"
import {
  PROJECT_PANE_ID,
  TODAY_LIST_ID,
  TODAY_PANE_ID,
  type Pane,
} from "../store/schema"
import PaneSeparator from "../ui/pane-separator"
import { usePaneWidths } from "./use-pane-widths"

export default function MainScreen() {
  const { gridTemplateColumns, resizeSidebar, resizeToday } = usePaneWidths()
  const selectedProjectId = useSelectedProjectId()
  const openTodoId = useOpenTodoId()
  const selectedKind = useCell("lists", selectedProjectId ?? "", "kind")
  const projectListId =
    selectedKind === "project" ? selectedProjectId : undefined

  // What each of the two columns is showing, as a pane or as nothing: a
  // column showing something other than a task list — no project selected, or
  // the editor open — has no pane for the keyboard to arrow into or a drag to
  // land on. What is left is the task panes in the order they appear on
  // screen, which is what makes "the pane to the right" mean anything.
  const projectPane: Pane | undefined =
    projectListId === undefined
      ? undefined
      : { listId: projectListId, paneId: PROJECT_PANE_ID }
  const todayPane: Pane | undefined =
    openTodoId === undefined
      ? { listId: TODAY_LIST_ID, paneId: TODAY_PANE_ID }
      : undefined
  const panes = [projectPane, todayPane].filter((pane) => pane !== undefined)
  useKeyboard(panes)

  const { handleDrag, handleDragEnd, handleDragStart } = useTaskDnd(
    panes.map((pane) => pane.listId),
  )

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragMove={handleDrag}
      onDragOver={handleDrag}
      onDragEnd={handleDragEnd}
    >
      <main
        className="grid h-dvh w-screen overflow-hidden bg-white"
        style={{ gridTemplateColumns }}
      >
        <Sidebar />

        <PaneSeparator label="Resize sidebar" onResize={resizeSidebar} />

        {projectListId !== undefined ? (
          <TaskListPane listId={projectListId} paneId={PROJECT_PANE_ID} />
        ) : (
          <NoProjectPane />
        )}

        <PaneSeparator label="Resize today pane" onResize={resizeToday} />

        {openTodoId !== undefined ? (
          <TaskEditorPane todoId={openTodoId} />
        ) : (
          <TaskListPane listId={TODAY_LIST_ID} paneId={TODAY_PANE_ID} />
        )}
      </main>
    </DragDropProvider>
  )
}
