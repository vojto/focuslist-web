# Migration: task drag-and-drop to `@dnd-kit/react`

Self-contained instructions for porting this app's drag-and-drop from
`@dnd-kit/core` v6 (current) to `@dnd-kit/react` 0.5.0 (the new, experimental
rewrite). Written so a fresh session with no prior context can execute it.

## Why

The current implementation works and passes its test suite, but it hand-rolls
what the new library provides natively: custom collision detection (~45
lines), slot placement with pointer math (~50 lines), a FLIP animation hook
(~45 lines), and a DragOverlay setup. The new library's official
"Multiple lists" example needs ~15 lines of handler code for the same
behavior. Goal: same behavior, much less owned code.

This is a SPIKE on a branch. Do not merge to main. Deliverable: a branch
where the acceptance suite passes, plus a report (what got deleted, what got
added, anything that fought back).

## App context (read this first)

- Vite + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`), Tailwind,
  React Compiler enabled, ESLint type-aware + Prettier (no semicolons,
  kebab-case filenames). `npm run build` and `npm run lint` must stay clean.
- Data layer is TinyBase v9 (`src/store/`): tables `lists {kind, name,
position}` and `todos {title, isCompleted, listId, position, projectId}`.
  A todo _shows_ in exactly one list (`listId` + fractional `position`) and
  _belongs_ to a project (`projectId`, untouched by scheduling). Ordered
  per-list views come from the `todosByList` index slice; the sidebar from
  `listsByKind`. Verify TinyBase APIs against `node_modules/tinybase/agents.md`
  and `node_modules/tinybase/@types/` — do not trust training data.
- `src/store/operations.ts` — `moveTodo(db, todoId, targetListId, index?)` is
  the single mutation for drops (fractional positions; index is relative to
  the target list WITHOUT the dragged todo). Keep it unchanged.
- TinyBase checkpoints (created in `src/store/store-provider.tsx`, accessed
  via `useCheckpoints()` from `src/store/hooks.ts`) implement drag-cancel:
  `addCheckpoint()` at drag start, `goTo(id)` on cancel, `addCheckpoint("Move
task")` on drop. Keep this pattern.
- Current DnD lives in: `src/screens/use-task-dnd.ts` (collision + placement
  - handlers), `src/hooks/use-flip-list.ts` (row animation),
    `src/components/panes/task-row.tsx` (draggable+droppable rows; also has a
    right-click ContextMenu — preserve it), `src/components/panes/
task-list-pane.tsx` (pane droppable), `src/screens/focus-screen.tsx`
    (DndContext + DragOverlay). The sidebar (`src/components/sidebar/
project-list.tsx`, `project-row.tsx`) uses old-dnd-kit sortable for project
    reordering and must be ported too (the old packages get removed).

## Reference example

Study the new library's official "Multiple lists" example BEFORE writing code:

- Source: <https://raw.githubusercontent.com/clauderic/dnd-kit/experimental/apps/stories/stories/react/Sortable/MultipleLists/MultipleLists.tsx>
  (download it). Live demo: <https://main--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/docs/react-sortable-multiple-lists--docs>
- Key APIs: `DragDropProvider` (from `@dnd-kit/react`), `useSortable` (from
  `@dnd-kit/react/sortable`) with `{id, index, group, type, accept,
feedback: "clone", collisionPriority}`, and `move(items, event)` (from
  `@dnd-kit/helpers`) which computes cross- and same-list placement on a
  `Record<groupId, id[]>`.
- Their handler shape (adapt, don't copy blindly):
  `onDragStart` → snapshot; `onDragOver` → `setItems(move(items, event))`;
  `onDragEnd` → restore snapshot when `event.canceled`.
- Inspect the installed package's TypeScript declarations for exact signatures
  (`node_modules/@dnd-kit/react`, `@dnd-kit/helpers`) — the library is 0.x
  and moves fast; types are the source of truth, not docs or memory.

## Steps

1. `npm install -E @dnd-kit/react@0.5.0 @dnd-kit/helpers@0.5.0` (exact pin —
   0.x package).
2. Port the two panes' task drag:
   - `DragDropProvider` replaces `DndContext`/`DragOverlay` in
     `focus-screen.tsx`.
   - Task rows: `useSortable` with `id` = todo row id, `group` = its list id,
     `index` = its position in the slice, `type: "item"`, `accept: "item"`,
     `feedback: "clone"` (this replaces the DragOverlay + the overlay/
     placeholder variants of `TaskRowCard`). Keep the ContextMenu wrapping.
   - Panes: droppable target for their list id accepting `"item"` with
     `CollisionPriority.Low` (so rows win when hovered) — see how the example
     treats columns; panes are NOT draggable.
   - Handlers (in a slimmed `use-task-dnd.ts` or inline): TinyBase stays the
     source of truth. On drag over, build `Record<listId, todoIds[]>` for the
     visible lists from the index slices, run `move(...)`, find the dragged
     todo's new list + index in the result, call `moveTodo` (skip when
     unchanged). Checkpoint pattern as described above. If `move`'s result is
     awkward to diff, it's acceptable to instead read the sortable's final
     `index`/`group` from the event — inspect the event types for what's
     available.
3. Port the sidebar project reorder the same way (single list, `type:
"project"`, its own `DragDropProvider`; on drop call
   `reorderProjects(db, orderedIds)`).
4. Remove now-dead code: `use-flip-list.ts` (the new library animates
   natively; the FLIP hook would double-animate), old collision/placement
   logic, `TaskRowCard`'s `overlay`/`placeholder` props if unused, and the
   old deps: `npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.
5. `npx prettier --write src && npm run build && npm run lint` — all clean.

## Acceptance (must all pass)

Playwright is available at
`/Users/vojto/Code/Active/focustask/node_modules/playwright` (the smoke
scripts require it by absolute path). Start the dev server (`npm run dev`,
background); it may not get port 5174 — check the port Vite prints and `sed`
the URL in the scripts if needed. Then:

- `node scripts/smoke-gap.cjs` — mid-drag gap positions (top-edge crossing,
  row lower-half, bottom padding, back to top, drop-where-gap-was, same-list
  reorder). All checks true.
- `node scripts/smoke-dnd.cjs` — cross-pane drag, persistence across reload,
  Escape-cancel restores, drag back. All true EXCEPT "project badge shown"
  which is expected `false` (the badge is intentionally commented out).
- `node scripts/smoke-padding.cjs` — padding drop lands at top.
- The scripts drive real pointer events; if `feedback: "clone"` changes DOM
  structure (row texts/duplicates), adapt the scripts' selectors — but do not
  weaken what they assert.

Note: mid-drag assertions read row order via `textContent`. The old
implementation moved the real row on every pointer move; the new library may
keep a virtual placeholder instead. If so, adapt the mid-drag checks to
whatever DOM the new library renders — the user-visible requirement is: the
gap appears at the pointer-implied slot (above-midline = before that row,
below = after, below last row = end), and the drop always lands where the gap
was.

## Wrap-up

- Commit the result on the spike branch (not main), message explaining the
  port. Run `git diff --stat main` and include it in your report.
- Report: pass/fail per script, net lines added/removed, subjective notes
  (anything the new library made harder), and whether you recommend adopting.
