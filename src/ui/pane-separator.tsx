import type { PointerEvent as ReactPointerEvent } from "react"

interface PaneSeparatorProps {
  label: string
  onResize: (pointerX: number) => void
  onResizeEnd: (pointerX: number) => void
}

export default function PaneSeparator({
  label,
  onResize,
  onResizeEnd,
}: PaneSeparatorProps) {
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    document.body.classList.add("is-resizing-pane")

    const handlePointerMove = (moveEvent: PointerEvent) => {
      onResize(moveEvent.clientX)
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      onResizeEnd(upEvent.clientX)
      document.body.classList.remove("is-resizing-pane")
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <div
      aria-label={label}
      className="relative z-10 w-px cursor-col-resize bg-neutral-200 before:absolute before:inset-y-0 before:left-1/2 before:w-3 before:-translate-x-1/2 before:content-['']"
      onPointerDown={handlePointerDown}
      role="separator"
    />
  )
}
