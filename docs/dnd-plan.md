# Inter-pane drag and drop — plan

Goal: drag tasks between the Today pane and project panes (and any future pane),
with live re-homing — while dragging, the task visibly leaves its old list and a
gap opens at the drop position in the new one.

Reference implementation for most patterns: `../focustask` (board ⇄ weekly
planner drag with the same requirements). We adapt its ideas rather than its
code, since focuslist's model is simpler (flat lists, no board cells).

## Foundation (done in the store rewrite)

The store is the single synchronous source of truth; persistence is a
background concern (`zustand/persist`). This is what makes re-homing simple:
rendering a hypothetical layout is just rendering different state — no async
gap, no optimistic overlay, no catch-up reconciliation.

- **Lists are records**: `TaskList { id, kind: "today" | "project", name, todoIds }`.
  Membership and order are the same fact: the `todoIds` array. A todo appears
  in exactly one list's array at a time.
- **Belonging is separate from placement**: `Todo.projectId` records which
  project a task belongs to and is _never_ changed by scheduling. Dragging a
  task to Today moves its id into Today's array but leaves `projectId` alone —
  that's why Today rows can show a project badge and why Unschedule knows where
  to send the task back.
- **Pure operations** (`src/store/tasks/operations.ts`): `moveTodoToList(state,
todoId, targetListId, index)` returns the next state slices without touching
  the store. Store actions commit them; the drag preview (below) will call the
  same function on hypothetical state. Preview and commit cannot disagree.

## Step 1 — Drag data + a single DndContext

- One `DndContext` in `FocusScreen` wrapping both panes (required for
  cross-pane drags). The sidebar's project-reorder `DndContext` stays separate.
- A typed `DragData` union with a runtime guard (`getDragData`), following
  focustask's `src/components/drag-and-drop/card-dnd.ts`:
  - `{ type: "todo", todoId, listId }` — on every task row (a `useSortable`).
  - `{ type: "list", listId }` — on every pane's task area (a `useDroppable`),
    so drops work on empty lists and below the last row.
- Ids are globally unique already (`todo-…`, `project-…`, `today`), so rows use
  their todo id directly as the sortable id. Each pane renders a
  `SortableContext` over its list's `todoIds`.

## Step 2 — Live re-homing preview

The whole mechanism is one piece of state in the DnD hook
(`useTaskDnd`, colocated with `FocusScreen`):

```ts
const [previewListsById, setPreviewListsById] = useState<ListsById | null>(null)
```

- Panes render from `previewListsById ?? store.listsById`. That's the only
  interception point; panes/rows know nothing about dragging.
- `onDragOver`: resolve the drop target from `over`'s DragData (a todo → that
  todo's list + index; a list → append). Compute
  `moveTodoToList(previewState, …)` and set the result as the preview. dnd-kit
  fires this continuously; each update re-renders both panes, which is the
  re-homing effect.
- `onDragEnd`: commit via the store action `moveTodo(todoId, targetListId,
index)` — same pure op — then clear the preview. Store updates synchronously,
  so the frame after the drop renders identical positions: no flicker by
  construction.
- `onDragCancel`: clear the preview. Everything snaps back.
- `DragOverlay` shows the floating row (same pattern as the sidebar's
  `ProjectRowPreview`); the in-list original renders as a placeholder while
  dragging.

Note: `todosById` is never part of the preview — only id arrays move. Title
edits etc. keep flowing from the store even mid-drag.

## Step 3 — Collision detection

Start with `pointerWithin` falling back to `closestCorners`. If pointer-in-gap
behavior feels off (dropping into a pane's padding below the last card), port
focustask's `createCardCollisionDetection` + `resolveCellPaddingCollisions`
(`card-dnd.ts`), which solve exactly this.

## Step 4 — Generic panes, configurable splits

- Merge `TodayPane` / `ProjectPane` into `TaskListPane({ listId })`; per-kind
  header config (star + "Today" vs. project name).
- `FocusScreen` renders panes from an array of list ids (Today + the routed
  project for now). Future splits (two projects, a Delegated list) are changes
  to that array only.

## Step 5 — Today-pane extras

- Project badge on Today rows (done in the store rewrite via `Todo.projectId`).
- Right-click context menu on Today rows → "Unschedule": store action
  `unscheduleTodo(todoId)` moves the id from Today's array back to
  `projectId`'s array (append). Only shown for tasks that have a project.

## Later / optional

- Keyboard sensor + `sortableKeyboardCoordinates` for accessible dragging
  (focustask does this in `use-board-planner-dnd.tsx`).
- Auto-scroll tuning inside panes for long lists.
