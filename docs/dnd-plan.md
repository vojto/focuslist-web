# Inter-pane drag and drop — plan (TinyBase edition)

Goal: drag tasks between the Today pane and project panes (and any future
pane), with live re-homing — while dragging, the task visibly leaves its old
list and a gap opens at the drop position in the new one.

Reference implementation for the dnd-kit patterns: `../focustask` (board ⇄
weekly planner drag with the same requirements). We adapt its ideas rather
than its code; its preview-layout machinery is NOT needed here (see "The
checkpoint insight" below).

## Foundation (done in the TinyBase rewrite)

The data layer is a TinyBase store (`src/db.ts`) — synchronous, reactive,
persisted to localStorage (swap for the SQLite persister when the app moves to
Tauri). Two tables, SQL-style:

- `lists { kind: "today" | "project", name, position }` — the Today row plus
  one row per project; `position` orders the sidebar.
- `todos { title, isCompleted, listId, position, projectId? }` —
  - `listId` = **placement**: which list the todo currently shows in (exactly
    one at a time).
  - `position` = order within that list. Fractional positioning: inserting
    between two todos takes the midpoint, so drops never renumber neighbors.
  - `projectId` = **belonging**: never touched by scheduling. Dragging a todo
    onto Today changes `listId` only — that's why Today rows can show a
    project badge and why Unschedule knows where to send the todo back.

Each pane renders an index slice (`useSliceRowIds("todosByList", listId)`) —
the ordered id array that dnd-kit's `SortableContext` wants, kept reactive by
TinyBase. All mutations live in `src/lib/task-operations.ts`; the key one is
`moveTodo(todoId, targetListId, index?)`, which computes the fractional
position and updates `listId`/`position`/`projectId` in one transaction.

## The checkpoint insight (what TinyBase changes)

Earlier drafts of this plan needed a "preview layout" — hypothetical state
rendered during the drag, committed on drop, discarded on cancel — because we
didn't want to write real state mid-drag. TinyBase makes that whole layer
unnecessary via its checkpoints module (undo/redo built in):

- **Drag start** → `checkpoints.addCheckpoint()` to seal the pre-drag state,
  remembering its id.
- **Drag over a new spot** → just call `moveTodo` for real. Every pane
  re-renders from truth; the card re-homes live. The preview _is_ the store.
- **Drop** → nothing to do — the store is already correct. Add a checkpoint
  ("move task") so the drag is one undo step.
- **Cancel/Escape** → `checkpoints.goTo(preDragCheckpointId)` rolls everything
  back. dnd-kit's `onDragCancel` maps to exactly this.

Setup: `createCheckpoints(db)` from `tinybase/checkpoints/with-schemas`.
Notes:

- The localStorage persister auto-saves mid-drag states; harmless locally
  (worst case a refresh mid-drag lands on the drag's latest hover position).
- Checkpoints also give us app-wide undo/redo nearly for free later.

## Step 1 — Drag data + a single DndContext

- One `DndContext` in `FocusScreen` wrapping both panes (required for
  cross-pane drags). The sidebar's project-reorder `DndContext` stays
  separate.
- A typed `DragData` union with a runtime guard (`getDragData`), following
  focustask's `src/components/drag-and-drop/card-dnd.ts`:
  - `{ type: "todo", todoId, listId }` — on every task row (`useSortable`).
  - `{ type: "list", listId }` — on every pane's task area (`useDroppable`),
    so drops work on empty lists and below the last row.
- Row ids (`todo-…`) are globally unique, so they serve directly as sortable
  ids. Each pane renders a `SortableContext` over its slice's row ids.

## Step 2 — Live re-homing

The DnD hook (`useTaskDnd`, colocated with `FocusScreen`) holds only:

- the active drag's `todoId` (for the `DragOverlay`), and
- the pre-drag checkpoint id.

Handlers:

- `onDragStart`: record checkpoint + active todo.
- `onDragOver`: resolve the target (over a todo → that todo's `listId` and
  index within its slice; over a list area → append) and call `moveTodo`.
  Guard: skip if the todo is already at the target position.
- `onDragEnd`: `addCheckpoint("move task")`, clear active state.
- `onDragCancel`: `goTo(preDragCheckpointId)`, clear active state.
- `DragOverlay` renders the floating row (`TaskRow` reads by id, so the
  overlay is just `<TaskRow todoId={activeTodoId} />` styled as a card); the
  in-list original renders as a placeholder while dragging.

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

- Project badge on Today rows (done — driven by `projectId`).
- Right-click context menu on Today rows → "Unschedule": calls
  `unscheduleTodo(todoId)` (moves the todo back to its `projectId` list,
  appended). Only shown for todos that have a project.

## Later / optional

- Keyboard sensor + `sortableKeyboardCoordinates` for accessible dragging
  (focustask does this in `use-board-planner-dnd.tsx`).
- App-wide undo/redo UI on top of the same checkpoints.
- Auto-scroll tuning inside panes for long lists.
