import type {
  DragDropManager,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/react"
import { useRef } from "react"
import { useDb, type Db } from "../../store/hooks"
import { moveTodo } from "../../store/operations/todos"
import {
  currentCheckpoint,
  revertTo,
  sealUndoStep,
} from "../../store/operations/undo"
import type { ListId, TodoId } from "../../store/schema"

// TinyBase stays the source of truth mid-drag: every placement change is
// committed with moveTodo, so the row order on screen is always the real
// order and the drop has nothing left to do but seal the checkpoint.
//
// Placement ignores the library's collision targets entirely. On every
// dragmove/dragover the same rule runs: the pane is chosen by how much of
// the dragged card's rectangle overlaps each pane, and the slot within the
// pane by row midlines. Both depend only on the card's current rectangle —
// never on which list currently holds the todo — so re-running the rule
// after a commit gives the same answer (no oscillation).

// The dragged card moves to another pane once this share of it sits over
// that pane; below it, the card stays with the list the drag started from.
const TARGET_OVERLAP_RATIO = 0.3

// Structural stand-in for @dnd-kit/geometry's BoundingRectangle (a
// transitive dependency, so not importable directly).
interface CardRectangle {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

// Panes and rows both register as droppables, which is where the placement
// math reads its rectangles from — the library's own collision results are
// never consulted.
function rectOf(manager: DragDropManager, id: string): DOMRect | undefined {
  return manager.registry.droppables.get(id)?.element?.getBoundingClientRect()
}

function commitMove(db: Db, todoId: TodoId, listId: ListId, index: number) {
  // moveTodo's index is relative to the target list without the dragged
  // todo, which equals the todo's own index in the target order.
  const slice = db.indexes.getSliceRowIds("todosByList", listId)
  const alreadyThere =
    db.store.getCell("todos", todoId, "listId") === listId &&
    slice.indexOf(todoId) === index
  if (!alreadyThere) {
    moveTodo(db, todoId, listId, index)
  }
}

// The dragged card's viewport rectangle. Keyboard drags may have no tracked
// shape; the pointer position stands in as a point-sized card.
function cardRectangle(event: DragMoveEvent | DragOverEvent): CardRectangle {
  const shape = event.operation.shape
  if (shape !== null) {
    return shape.current.boundingRectangle
  }
  const { x, y } = event.operation.position.current
  return { left: x, right: x + 1, top: y, bottom: y + 1, width: 1, height: 1 }
}

// How much of the card sits over the pane, as a share of the card's width.
// The min() keeps the threshold reachable when a card picked up in a wide
// pane is dragged into a much narrower one (the share is then measured
// against the pane instead). Panes span the full column side by side, so
// vertical overlap only gates.
function paneOverlapRatio(card: CardRectangle, pane: DOMRect): number {
  const overlapY =
    Math.min(card.bottom, pane.bottom) - Math.max(card.top, pane.top)
  const overlapX =
    Math.min(card.right, pane.right) - Math.max(card.left, pane.left)
  if (overlapY <= 0 || overlapX <= 0) {
    return 0
  }
  return overlapX / Math.min(card.width, pane.width)
}

// Which list the card should live in right now, or null to leave the last
// committed placement alone (card over neither pane, e.g. the sidebar).
function placementListId(
  manager: DragDropManager,
  event: DragMoveEvent | DragOverEvent,
  visibleListIds: readonly ListId[],
  sourceListId: ListId,
): ListId | null {
  const card = cardRectangle(event)
  let isOverSource = false
  let targetListId: ListId | null = null
  for (const listId of visibleListIds) {
    const paneRect = rectOf(manager, listId)
    if (paneRect === undefined) {
      continue
    }
    const ratio = paneOverlapRatio(card, paneRect)
    if (listId === sourceListId) {
      isOverSource = ratio > 0
    } else if (ratio >= TARGET_OVERLAP_RATIO) {
      targetListId = listId
    }
  }
  if (targetListId !== null) {
    return targetListId
  }
  return isOverSource ? sourceListId : null
}

// The slot within the pane follows row midlines: the card goes before the
// first row whose midline its center is above — so below the last row
// appends.
function commitPlacement(
  db: Db,
  manager: DragDropManager,
  event: DragMoveEvent | DragOverEvent,
  listId: ListId,
  todoId: TodoId,
) {
  const y =
    event.operation.shape?.current.center.y ??
    event.operation.position.current.y
  // The slot is simply how many rows the card's center has passed.
  const index = db.indexes
    .getSliceRowIds("todosByList", listId)
    .filter((rowId) => {
      const rowRect = rowId === todoId ? undefined : rectOf(manager, rowId)
      return rowRect !== undefined && y > rowRect.top + rowRect.height / 2
    }).length
  commitMove(db, todoId, listId, index)
}

export function useTaskDnd(visibleListIds: readonly ListId[]) {
  const db = useDb()
  const preDragCheckpointRef = useRef<string | null>(null)
  const sourceListIdRef = useRef<ListId | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    // Reading the current checkpoint rather than adding one: the drag has
    // changed nothing yet, and sealing here would bank the pointerdown's
    // selection change as an undo step that undoes nothing.
    preDragCheckpointRef.current = currentCheckpoint(db) ?? null
    const source = event.operation.source
    sourceListIdRef.current =
      source === null
        ? null
        : (db.store.getCell("todos", String(source.id), "listId") ?? null)
  }

  // Wired to both dragmove and dragover: dragmove covers pointer movement,
  // dragover covers target changes without it (rows scrolling under a
  // stationary pointer). Never preventDefault() here — it freezes the drag.
  const handleDrag = (
    event: DragMoveEvent | DragOverEvent,
    manager: DragDropManager,
  ) => {
    const source = event.operation.source
    const sourceListId = sourceListIdRef.current
    if (source === null || sourceListId === null) {
      return
    }
    const todoId = String(source.id)
    if (!db.store.hasRow("todos", todoId)) {
      return
    }
    const listId = placementListId(manager, event, visibleListIds, sourceListId)
    if (listId !== null) {
      commitPlacement(db, manager, event, listId, todoId)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      if (preDragCheckpointRef.current !== null) {
        revertTo(db, preDragCheckpointRef.current)
      }
      return
    }
    // Seals the whole drag as one undo step (no-op when nothing changed).
    sealUndoStep(db, "Move task")
  }

  return { handleDrag, handleDragEnd, handleDragStart }
}
