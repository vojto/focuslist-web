import { DragDropProvider } from "@dnd-kit/react"
import NoProjectPane from "../components/panes/no-project-pane"
import TaskListPane from "../components/panes/task-list-pane"
import Sidebar from "../components/sidebar/sidebar"
import { useTaskDnd } from "../components/task-list/use-task-dnd"
import { useSelectedProjectId } from "../hooks/use-selected-project"
import type { Pane } from "../keyboard/commands"
import { useKeyboard } from "../keyboard/use-keyboard"
import { useCell } from "../store/hooks"
import { PROJECT_PANE_ID, TODAY_LIST_ID, TODAY_PANE_ID } from "../store/schema"
import PaneSeparator from "../ui/pane-separator"
import { usePaneWidths } from "./use-pane-widths"

export default function MainScreen() {
  const { gridTemplateColumns, resizeSidebar, resizeToday } = usePaneWidths()
  const selectedProjectId = useSelectedProjectId()
  const selectedKind = useCell("lists", selectedProjectId ?? "", "kind")
  const projectListId =
    selectedKind === "project" ? selectedProjectId : undefined

  // The task panes in the order they appear on screen, which is what makes
  // "the pane to the right" meaningful to a keyboard command.
  const panes: Pane[] =
    projectListId === undefined
      ? [{ listId: TODAY_LIST_ID, paneId: TODAY_PANE_ID }]
      : [
          { listId: projectListId, paneId: PROJECT_PANE_ID },
          { listId: TODAY_LIST_ID, paneId: TODAY_PANE_ID },
        ]
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

        <TaskListPane listId={TODAY_LIST_ID} paneId={TODAY_PANE_ID} />
      </main>
    </DragDropProvider>
  )
}
