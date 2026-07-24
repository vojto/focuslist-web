import {
  closestCenter,
  closestCorners,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
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
  event: DragOverEvent | DragEndEvent,
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
    const draggedRect = active.rect.current.translated
    const isBelowOverRow =
      draggedRect !== null &&
      draggedRect.top + draggedRect.height / 2 >
        over.rect.top + over.rect.height / 2
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

  // Prefer the todo row under the pointer over the pane droppable behind it.
  // In a pane's padding (beside/above the rows), snap to the nearest row so
  // the pointer's vertical position picks the slot — except below the last
  // row, where the pane itself (= append) is the right target. Fall back to
  // nearest-corner matching outside any droppable.
  const collisionDetection: CollisionDetection = (args) => {
    const withinPointer = pointerWithin(args)
    const todoCollision = withinPointer.find(({ id }) =>
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

  // Cross-list re-homing happens live: the todo really changes lists
  // mid-drag. Hovering within one list is previewed by SortableContext's
  // transforms and committed in handleDragEnd.
  const handleDragOver = (event: DragOverEvent) => {
    const todoId = String(event.active.id)
    if (event.over === null || String(event.over.id) === todoId) {
      return
    }
    const target = dropTarget(db, event)
    if (
      target === null ||
      target.listId === db.store.getCell("todos", todoId, "listId")
    ) {
      return
    }
    moveTodo(db, todoId, target.listId, target.index)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const todoId = String(event.active.id)
    if (event.over !== null && String(event.over.id) !== todoId) {
      const target = dropTarget(db, event)
      if (target !== null) {
        moveTodo(db, todoId, target.listId, target.index)
      }
    }
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
    handleDragOver,
    handleDragStart,
    sensors,
  }
}
