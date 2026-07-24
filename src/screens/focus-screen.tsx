import { DndContext, DragOverlay } from "@dnd-kit/core"
import { useState } from "react"
import TaskListPane from "../components/panes/task-list-pane"
import { TaskRowCard } from "../components/panes/task-row"
import Sidebar from "../components/sidebar/sidebar"
import { useSelectedProjectId } from "../hooks/use-selected-project"
import { useCell, useSetValueCallback, useValue } from "../store/hooks"
import { TODAY_LIST_ID } from "../store/schema"
import PaneSeparator from "../ui/pane-separator"
import { useTaskDnd } from "./use-task-dnd"

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
      <div className="grid flex-1 place-items-center overflow-y-auto p-8">
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-500">
            No project selected
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Choose a project from the sidebar.
          </p>
        </div>
      </div>
      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-50 p-2" />
    </section>
  )
}

export default function FocusScreen() {
  const storedSidebarWidth = useValue("sidebarWidth")
  const storedProjectWidth = useValue("projectWidth")
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
  const [sidebarWidth, setSidebarWidth] = useState(storedSidebarWidth)
  const [projectWidth, setProjectWidth] = useState(storedProjectWidth)

  const selectedProjectId = useSelectedProjectId()
  const selectedKind = useCell("lists", selectedProjectId ?? "", "kind")
  const projectListId =
    selectedKind === "project" ? selectedProjectId : undefined

  const {
    activeTodoId,
    collisionDetection,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    sensors,
  } = useTaskDnd()

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
    <DndContext
      collisionDetection={collisionDetection}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
          onResize={(pointerX) => setSidebarWidth(sidebarWidthAt(pointerX))}
          onResizeEnd={(pointerX) => {
            const width = sidebarWidthAt(pointerX)
            setSidebarWidth(width)
            storeSidebarWidth(width)
          }}
        />

        <TaskListPane listId={TODAY_LIST_ID} />

        <PaneSeparator
          label="Resize details pane"
          onResize={(pointerX) => setProjectWidth(projectWidthAt(pointerX))}
          onResizeEnd={(pointerX) => {
            const width = projectWidthAt(pointerX)
            setProjectWidth(width)
            storeProjectWidth(width)
          }}
        />

        {projectListId !== undefined ? (
          <TaskListPane listId={projectListId} />
        ) : (
          <NoProjectPane />
        )}
      </main>

      <DragOverlay>
        {activeTodoId === null ? null : (
          <TaskRowCard overlay showProject todoId={activeTodoId} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
