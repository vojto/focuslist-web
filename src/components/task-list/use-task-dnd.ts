import { move } from "@dnd-kit/helpers"
import type {
  DragDropManager,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
} from "@dnd-kit/react"
import { useRef } from "react"
import { useCheckpoints, useDb, type Db } from "../../store/hooks"
import { moveTodo } from "../../store/operations/todos"
import type { ListId, TodoId } from "../../store/schema"

// TinyBase stays the source of truth mid-drag: every placement change is
// committed with moveTodo, so the row order on screen is always the real
// order and the drop has nothing left to do but seal the checkpoint.

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

// Hovering a pane (not a row: its padding, or an empty list) places by row
// midlines, exactly like the old collision logic: the slot is before the
// first row whose midline the dragged card's center is above — so below the
// last row appends. `move`'s own pane handling splits at the pane's center
// instead, which teleports "just below the rows" drops to the top.
function commitPaneHover(
  db: Db,
  manager: DragDropManager,
  event: DragOverEvent | DragMoveEvent,
  listId: ListId,
  todoId: TodoId,
) {
  const y =
    event.operation.shape?.current.center.y ??
    event.operation.position.current.y
  const rowIds = db.indexes
    .getSliceRowIds("todosByList", listId)
    .filter((id) => id !== todoId)
  let index = 0
  for (const rowId of rowIds) {
    const element = manager.registry.droppables.get(rowId)?.element
    if (element !== undefined) {
      const rect = element.getBoundingClientRect()
      if (y > rect.top + rect.height / 2) {
        index += 1
      }
    }
  }
  commitMove(db, todoId, listId, index)
}

// Hovering a row delegates the slot math to `move` from @dnd-kit/helpers,
// fed with a Record<listId, todoIds[]> built from the visible lists' slices.
function commitRowHover(
  db: Db,
  visibleListIds: readonly ListId[],
  event: DragOverEvent,
  todoId: TodoId,
) {
  const lists: Record<string, string[]> = {}
  for (const listId of visibleListIds) {
    lists[listId] = [...db.indexes.getSliceRowIds("todosByList", listId)]
  }
  const moved = move(lists, event)
  for (const [listId, todoIds] of Object.entries(moved)) {
    const index = todoIds.indexOf(todoId)
    if (index !== -1) {
      commitMove(db, todoId, listId, index)
      return
    }
  }
}

// Shared guard for the drag handlers: only drags of real todos with a
// current target are acted on.
function todoDragOperands(db: Db, event: DragOverEvent | DragMoveEvent) {
  const { source, target } = event.operation
  if (source == null || target == null) {
    return null
  }
  const todoId = String(source.id)
  if (!db.store.hasRow("todos", todoId)) {
    return null
  }
  return { targetId: String(target.id), todoId }
}

export function useTaskDnd(visibleListIds: readonly ListId[]) {
  const db = useDb()
  const checkpoints = useCheckpoints()
  const preDragCheckpointRef = useRef<string | null>(null)

  const handleDragStart = () => {
    preDragCheckpointRef.current = checkpoints?.addCheckpoint() ?? null
  }

  const handleDragOver = (event: DragOverEvent, manager: DragDropManager) => {
    const operands = todoDragOperands(db, event)
    if (operands === null) {
      return
    }
    const { targetId, todoId } = operands
    if (visibleListIds.includes(targetId)) {
      commitPaneHover(db, manager, event, targetId, todoId)
    } else {
      commitRowHover(db, visibleListIds, event, todoId)
    }
  }

  // dragover only fires when the hovered droppable changes, but while
  // hovering a pane the implied slot follows the pointer with no target
  // change — so pane hovers also commit on every dragmove.
  const handleDragMove = (event: DragMoveEvent, manager: DragDropManager) => {
    const operands = todoDragOperands(db, event)
    if (operands !== null && visibleListIds.includes(operands.targetId)) {
      commitPaneHover(db, manager, event, operands.targetId, operands.todoId)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      if (preDragCheckpointRef.current !== null) {
        checkpoints?.goTo(preDragCheckpointRef.current)
      }
      return
    }
    // Seals the whole drag as one undo step (no-op when nothing changed).
    checkpoints?.addCheckpoint("Move task")
  }

  return { handleDragEnd, handleDragMove, handleDragOver, handleDragStart }
}
