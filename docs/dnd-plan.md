# Inter-pane drag and drop — plan

Goal: drag tasks between the Today pane and project panes. While dragging, the
task visibly leaves its old list and a gap opens at the drop position in the
new one (live re-homing).

dnd-kit pattern reference: `../focustask`. We take its ideas, not its code —
our model (flat lists, synchronous TinyBase store) needs far less machinery.

## The core idea: drag writes the real store

There is no preview state, no drag payloads, no rollback machinery.

- **While dragging over a new spot, we just call `moveTodo` for real.** The
  store is synchronous, every pane re-renders from truth, the card re-homes
  live. The preview _is_ the store.
- **Drop** → nothing to do; the store is already correct.
- **Cancel (Escape)** → TinyBase checkpoints: `addCheckpoint()` at drag start
  seals the pre-drag state; cancel is `goTo(preDragCheckpointId)`. Drop adds a
  labeled checkpoint so a whole drag is one undo step. Chosen over a manual
  cell snapshot to stay future-proof: the same checkpoints give app-wide
  undo/redo later. (`createCheckpoints` from `tinybase/checkpoints/with-schemas`,
  provided alongside the store.)
- **No drag data.** dnd-kit ids are store row ids. `over.id` is either a todo
  (`hasRow("todos", id)` → target = its `listId`, index = `indexOf` in that
  list's slice) or a pane's empty-area droppable (a list id → append).
- **One mutation.** Cross-list re-homing writes `moveTodo` on dragOver;
  same-list hovering is previewed by SortableContext's own transforms (writing
  the store there too would fight them and jitter) and the final order is the
  same `moveTodo` call on drop. Within-pane sorting isn't a feature, it falls
  out.

Note: the localStorage persister auto-saves mid-drag states; harmless locally
(worst case a refresh mid-drag lands on the latest hover position).

## Step 1 — Generic pane first

Merge `TodayPane` / `ProjectPane` into `TaskListPane({ listId })` (per-kind
header: star + "Today" vs. project name). They already render the same
slice-of-ids shape; merging first means the DnD wiring is written once.
`FocusScreen` renders panes from an array of list ids (Today + routed project
for now) — future splits are changes to that array only.

## Step 2 — The drag itself

- One `DndContext` in `FocusScreen` wrapping both panes. (The sidebar's
  project-reorder context stays separate.)
- Each `TaskListPane`: a `SortableContext` over its slice's row ids, plus a
  `useDroppable` (id = list id) on the task area for empty lists and
  below-the-last-row drops.
- `useTaskDnd` holds only the active `todoId` and the pre-drag checkpoint id:
  - `onDragStart`: `addCheckpoint()`, set active.
  - `onDragOver`: resolve target from `over.id`, call `moveTodo` (skip if
    already there).
  - `onDragEnd`: `addCheckpoint("Move task")`, clear active.
  - `onDragCancel`: `goTo(preDragCheckpointId)`, clear active.
- `DragOverlay` shows the floating row (`<TaskRow todoId={activeId} />` styled
  as a card — rows read by id, so this is free); the in-list original renders
  as a placeholder. The overlay is needed because panes clip (`overflow-y`).

## Step 3 — Collision detection

`pointerWithin`, falling back to `closestCorners`. Only if drops into pane
padding feel wrong, port focustask's `createCardCollisionDetection` +
`resolveCellPaddingCollisions` (`card-dnd.ts`) — they solve exactly that.

## Step 4 — Unschedule

Right-click a Today row → "Unschedule" → `unscheduleTodo` sends it back to its
`projectId` list (appended). Shown only for todos that have a project. (The
project badge on Today rows already works.)

## Later / optional

- App-wide undo/redo UI on top of the same checkpoints.
- Keyboard sensor + `sortableKeyboardCoordinates` for accessible dragging.
- Auto-scroll tuning inside panes for long lists.
- Renumber a list's positions on drop if fractional midpoints ever get
  pathologically small (repeated inserts into the same gap halve the
  interval; irrelevant at hundreds of todos).
