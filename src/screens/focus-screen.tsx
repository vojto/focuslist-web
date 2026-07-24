import { useState } from "react"
import ProjectPane from "../components/panes/project-pane"
import Sidebar from "../components/sidebar/sidebar"
import TodayPane from "../components/panes/today-pane"
import { useUiStore } from "../stores/ui-store"
import PaneSeparator from "../ui/pane-separator"

const MIN_SIDEBAR_WIDTH = 176
const MAX_SIDEBAR_WIDTH = 320
const MIN_CONTENT_WIDTH = 320
const SEPARATOR_WIDTH = 1

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

export default function FocusScreen() {
  const storedSidebarWidth = useUiStore((state) => state.sidebarWidth)
  const storedProjectWidth = useUiStore((state) => state.projectWidth)
  const storeSidebarWidth = useUiStore((state) => state.setSidebarWidth)
  const storeProjectWidth = useUiStore((state) => state.setProjectWidth)
  const [sidebarWidth, setSidebarWidth] = useState(storedSidebarWidth)
  const [projectWidth, setProjectWidth] = useState(storedProjectWidth)

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

      <TodayPane />

      <PaneSeparator
        label="Resize details pane"
        onResize={(pointerX) => setProjectWidth(projectWidthAt(pointerX))}
        onResizeEnd={(pointerX) => {
          const width = projectWidthAt(pointerX)
          setProjectWidth(width)
          storeProjectWidth(width)
        }}
      />

      <ProjectPane />
    </main>
  )
}
