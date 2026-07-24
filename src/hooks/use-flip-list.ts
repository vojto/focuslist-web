import { useLayoutEffect, useRef, type RefObject } from "react"

// FLIP-animates a list container's children: after every render, any child
// with a data-flip-id that has moved slides from its previous position to its
// new one instead of snapping. Purely presentational — it animates whatever
// the real layout did, so it can never disagree with the data. The transform
// is applied to the child's first element (the card), never to the measured
// child itself, so drop-target measurements always see true layout positions.
export function useFlipList(containerRef: RefObject<HTMLElement | null>) {
  const previousRectsRef = useRef(new Map<string, DOMRect>())

  useLayoutEffect(() => {
    const container = containerRef.current
    if (container === null) {
      return
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const nextRects = new Map<string, DOMRect>()
    for (const element of container.children) {
      if (!(element instanceof HTMLElement)) {
        continue
      }
      const flipId = element.dataset.flipId
      if (flipId === undefined) {
        continue
      }
      const rect = element.getBoundingClientRect()
      nextRects.set(flipId, rect)
      const previous = previousRectsRef.current.get(flipId)
      if (previous === undefined || reduceMotion) {
        continue
      }
      const deltaX = previous.left - rect.left
      const deltaY = previous.top - rect.top
      const card = element.firstElementChild
      if ((deltaX !== 0 || deltaY !== 0) && card instanceof HTMLElement) {
        card.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 160, easing: "ease" },
        )
      }
    }
    previousRectsRef.current = nextRects
  })
}
