import {
  closestCenter,
  closestCorners,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useRef, useState } from "react"
import { useCheckpoints, useDb, type Db } from "../store/hooks"
import { moveTodo } from "../store/operations"
import type { ListId, TodoId } from "../store/schema"

// There is no drag payload: dnd-kit ids are store row ids, so the store
// answers everything. `over` is either a todo row (target = that row's list;
// the slot before or after it, depending on whether the dragged card's center
// is above or below the row's center) or a pane's task area (target = that
// list, appended). Indexes are relative to the list without the dragged todo,
// matching how moveTodo inserts.
function dropTarget(
  db: Db,
  event: DragMoveEvent | DragEndEvent,
): { listId: ListId; index?: number } | null {
  const { active, over } = event
  if (over === null) {
    return null
  }
  const overId = String(over.id)
  if (db.store.hasRow("todos", overId)) {
    const listId = db.store.getCell("todos", overId, "listId")
    if (listId === undefined) {
      return null
    }
    const index = db.indexes
      .getSliceRowIds("todosByList", listId)
      .filter((id) => id !== String(active.id))
      .indexOf(overId)
    if (index === -1) {
      return { listId }
    }
    // Pointer position = where the drag started + how far it has moved.
    // (The active draggable's own rect is unreliable here: it re-measures
    // from the placeholder, which itself moves as the todo re-homes.)
    const { activatorEvent, delta } = event
    const pointerY =
      activatorEvent instanceof PointerEvent
        ? activatorEvent.clientY + delta.y
        : null
    const isBelowOverRow =
      pointerY !== null && pointerY > over.rect.top + over.rect.height / 2
    return { listId, index: index + (isBelowOverRow ? 1 : 0) }
  }
  if (db.store.hasRow("lists", overId)) {
    return { listId: overId }
  }
  return null
}

function isPointerBelowLastRow(
  args: Parameters<CollisionDetection>[0],
  rowIds: readonly string[],
): boolean {
  const pointerY = args.pointerCoordinates?.y
  const lastRowId = rowIds.at(-1)
  if (pointerY === undefined || lastRowId === undefined) {
    return false
  }
  const lastRowRect = args.droppableRects.get(lastRowId)
  return (
    lastRowRect !== undefined &&
    pointerY > lastRowRect.top + lastRowRect.height / 2
  )
}

export function useTaskDnd() {
  const db = useDb()
  const checkpoints = useCheckpoints()
  const [activeTodoId, setActiveTodoId] = useState<TodoId | null>(null)
  const preDragCheckpointRef = useRef<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Prefer the todo row under the pointer over the pane droppable behind it
  // (never the dragged row itself). In a pane's padding (beside/above the
  // rows), snap to the nearest row so the pointer's vertical position picks
  // the slot — except below the last row, where the pane itself (= append) is
  // the right target. Fall back to nearest-corner matching outside any
  // droppable.
  const collisionDetection: CollisionDetection = (args) => {
    const withinPointer = pointerWithin(args)
    const todoCollision = withinPointer.find(
      ({ id }) =>
        String(id) !== String(args.active.id) &&
        db.store.hasRow("todos", String(id)),
    )
    if (todoCollision !== undefined) {
      return [todoCollision]
    }
    const listCollision = withinPointer.find(({ id }) =>
      db.store.hasRow("lists", String(id)),
    )
    if (listCollision !== undefined) {
      const rowIds = db.indexes
        .getSliceRowIds("todosByList", String(listCollision.id))
        .filter((id) => id !== String(args.active.id))
      if (rowIds.length === 0 || isPointerBelowLastRow(args, rowIds)) {
        return [listCollision]
      }
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(({ id }) =>
          rowIds.includes(String(id)),
        ),
      })
    }
    return withinPointer.length > 0 ? withinPointer : closestCorners(args)
  }

  const handleDragStart = (event: DragStartEvent) => {
    preDragCheckpointRef.current = checkpoints?.addCheckpoint() ?? null
    setActiveTodoId(String(event.active.id))
  }

  // One code path: every pointer move commits the real order, whether the
  // move is across lists or within one. (onDragMove, not onDragOver — the
  // latter only fires when the hovered droppable changes, so it never sees
  // the pointer crossing a row's midline.) The in-list placeholder row IS
  // the drop preview, so mid-drag visuals and the drop can never disagree.
  // Dropping has nothing left to do but seal the checkpoint.
  const handleDragMove = (event: DragMoveEvent) => {
    const todoId = String(event.active.id)
    const target = dropTarget(db, event)
    if (target === null) {
      return
    }
    const slice = db.indexes.getSliceRowIds("todosByList", target.listId)
    const alreadyAtTarget =
      db.store.getCell("todos", todoId, "listId") === target.listId &&
      slice.indexOf(todoId) === (target.index ?? slice.length - 1)
    if (!alreadyAtTarget) {
      moveTodo(db, todoId, target.listId, target.index)
    }
  }

  const handleDragEnd = () => {
    // Seals the whole drag as one undo step (no-op when nothing changed).
    checkpoints?.addCheckpoint("Move task")
    setActiveTodoId(null)
  }

  const handleDragCancel = () => {
    if (preDragCheckpointRef.current !== null) {
      checkpoints?.goTo(preDragCheckpointRef.current)
    }
    setActiveTodoId(null)
  }

  return {
    activeTodoId,
    collisionDetection,
    handleDragCancel,
    handleDragEnd,
    handleDragMove,
    handleDragStart,
    sensors,
  }
}
