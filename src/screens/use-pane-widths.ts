import { useSetValueCallback, useValue } from "../store/hooks"

// The screen is a five-column grid: sidebar, separator, project pane,
// separator, Today pane. Only the two outer columns have stored widths; the
// project pane takes what is left.
const MIN_SIDEBAR_WIDTH = 176
const MAX_SIDEBAR_WIDTH = 320
const MIN_CONTENT_WIDTH = 320
const SEPARATOR_WIDTH = 1

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

// Owns the column widths and the clamping a separator drag has to respect,
// so the screen itself is left with nothing but composition. Widths persist,
// so a resize writes straight to the store on every pointer move.
export function usePaneWidths() {
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
  const todayColumn = projectWidth ? `${projectWidth}px` : "minmax(0, 1fr)"

  return {
    gridTemplateColumns: `${sidebarWidth}px ${SEPARATOR_WIDTH}px minmax(0, 1fr) ${SEPARATOR_WIDTH}px ${todayColumn}`,

    resizeSidebar: (pointerX: number) => {
      storeSidebarWidth(clamp(pointerX, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH))
    },

    // Dragged from the right edge, so the pointer measures the Today pane;
    // the maximum is whatever leaves the project pane its minimum.
    resizeToday: (pointerX: number) => {
      storeProjectWidth(
        clamp(
          window.innerWidth - pointerX,
          MIN_CONTENT_WIDTH,
          window.innerWidth -
            sidebarWidth -
            MIN_CONTENT_WIDTH -
            SEPARATOR_WIDTH * 2,
        ),
      )
    },
  }
}
