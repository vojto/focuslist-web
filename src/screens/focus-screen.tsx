import { DragDropProvider } from "@dnd-kit/react"
import TaskListPane from "../components/panes/task-list-pane"
import Sidebar from "../components/sidebar/sidebar"
import { useSelectedProjectId } from "../hooks/use-selected-project"
import { useKeyboard } from "../keyboard/use-keyboard"
import { useCell, useSetValueCallback, useValue } from "../store/hooks"
import { TODAY_LIST_ID } from "../store/schema"
import PaneSeparator from "../ui/pane-separator"
import ToolbarButton from "../ui/toolbar-button"
import { useTaskDnd } from "../components/task-list/use-task-dnd"

const MIN_SIDEBAR_WIDTH = 176
const MAX_SIDEBAR_WIDTH = 320
const MIN_CONTENT_WIDTH = 320
const SEPARATOR_WIDTH = 1

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function NoProjectPane() {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-neutral-50">
      <div className="grid min-h-0 flex-1 place-items-center">
        <p className="text-sm text-neutral-400">No project selected</p>
      </div>
      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-white p-2">
        <ToolbarButton disabled>
          <span aria-hidden="true">＋</span>
          New task
        </ToolbarButton>
      </footer>
    </section>
  )
}

export default function FocusScreen() {
  useKeyboard()
  const sidebarWidth = useValue("sidebarWidth")
  const projectWidth = useValue("projectWidth")
  const storeSidebarWidth = useSetValueCallback(
    "sidebarWidth",
    (width: number) => width,
    [],
  )
  const storeProjectWidth = useSetValueCallback(
    "projectWidth",
    (width: number) => width,
    [],
  )

  const selectedProjectId = useSelectedProjectId()
  const selectedKind = useCell("lists", selectedProjectId ?? "", "kind")
  const projectListId =
    selectedKind === "project" ? selectedProjectId : undefined

  const visibleListIds =
    projectListId === undefined
      ? [TODAY_LIST_ID]
      : [TODAY_LIST_ID, projectListId]
  const { handleDrag, handleDragEnd, handleDragStart } =
    useTaskDnd(visibleListIds)

  const sidebarWidthAt = (pointerX: number) =>
    clamp(pointerX, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)

  const projectWidthAt = (pointerX: number) =>
    clamp(
      window.innerWidth - pointerX,
      MIN_CONTENT_WIDTH,
      window.innerWidth -
        sidebarWidth -
        MIN_CONTENT_WIDTH -
        SEPARATOR_WIDTH * 2,
    )

  const projectColumn = projectWidth ? `${projectWidth}px` : "minmax(0, 1fr)"

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragMove={handleDrag}
      onDragOver={handleDrag}
      onDragEnd={handleDragEnd}
    >
      <main
        className="grid h-dvh w-screen overflow-hidden bg-white"
        style={{
          gridTemplateColumns: `${sidebarWidth}px ${SEPARATOR_WIDTH}px minmax(0, 1fr) ${SEPARATOR_WIDTH}px ${projectColumn}`,
        }}
      >
        <Sidebar />

        <PaneSeparator
          label="Resize sidebar"
          onResize={(pointerX) => storeSidebarWidth(sidebarWidthAt(pointerX))}
        />

        {projectListId !== undefined ? (
          <TaskListPane listId={projectListId} paneId="left" />
        ) : (
          <NoProjectPane />
        )}

        <PaneSeparator
          label="Resize today pane"
          onResize={(pointerX) => storeProjectWidth(projectWidthAt(pointerX))}
        />

        <TaskListPane listId={TODAY_LIST_ID} paneId="right" />
      </main>
    </DragDropProvider>
  )
}
