import {
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
// answers everything. `over` is either a todo row (target = its list at its
// index) or a pane's task area (target = that list, appended).
function dropTarget(
  db: Db,
  overId: string,
): { listId: ListId; index?: number } | null {
  if (db.store.hasRow("todos", overId)) {
    const listId = db.store.getCell("todos", overId, "listId")
    if (listId === undefined) {
      return null
    }
    const index = db.indexes
      .getSliceRowIds("todosByList", listId)
      .indexOf(overId)
    return { listId, index }
  }
  if (db.store.hasRow("lists", overId)) {
    return { listId: overId }
  }
  return null
}

export function useTaskDnd() {
  const db = useDb()
  const checkpoints = useCheckpoints()
  const [activeTodoId, setActiveTodoId] = useState<TodoId | null>(null)
  const preDragCheckpointRef = useRef<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Prefer the todo row under the pointer over the pane droppable behind it;
  // fall back to nearest-corner matching outside any droppable.
  const collisionDetection: CollisionDetection = (args) => {
    const withinPointer = pointerWithin(args)
    const todoCollision = withinPointer.find(({ id }) =>
      db.store.hasRow("todos", String(id)),
    )
    if (todoCollision !== undefined) {
      return [todoCollision]
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
    const overId = event.over === null ? null : String(event.over.id)
    if (overId === null || overId === todoId) {
      return
    }
    const target = dropTarget(db, overId)
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
    const overId = event.over === null ? null : String(event.over.id)
    if (overId !== null && overId !== todoId) {
      const target = dropTarget(db, overId)
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
