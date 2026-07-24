# Agent Instructions

## About this project

A local-first todo app ("focuslist"): a Today list plus per-project lists.
React 19 + Vite + TypeScript (strict, `noUncheckedIndexedAccess`) +
Tailwind v4. Domain data lives in TinyBase v9, persisted to localStorage.
Drag and drop uses `@dnd-kit/react` 0.5.0. There is no router — the
selected project is a store value (`selectedProjectId`); menus/dialogs
build on `@base-ui/react`.

## Programming preferences

Apply the "uberskill" in `~/.agents/skills/uberskill` for every coding task
(implementing, changing, reviewing, or refactoring). Read its `SKILL.md`,
then the relevant references — always `references/general-programming.md`,
plus `references/typescript-react.md` for the work in this repo. It governs
code structure, helper extraction, naming, change scope, and verification.

## Workflow

- The user tests changes in the running app themselves. Leave the dev server
  running (`npm run dev`, usually port 5174) and hand off; don't drive the
  app with Playwright unprompted.
- Acceptance scripts for drag and drop live in `scripts/smoke-*.cjs`
  (Playwright required by absolute path from the sibling `focustask`
  checkout). If a DOM change breaks their selectors, adapt the selectors —
  never weaken what they assert. The user runs them.
- Commit and push automatically as work progresses. Once a change is
  complete and verifying clean, `git add -A && git commit` it with a
  descriptive message and `git push origin main` — don't wait to be asked.
  Group each logically-cohesive change into its own commit; don't let
  unrelated edits pile up uncommitted. The exception is work the user is
  still actively testing or iterating on — hold the commit until it settles.
- Verify with `npm run build && npm run lint && npx prettier --check .` —
  all must pass clean before committing.

## React Compiler is enabled

`babel-plugin-react-compiler` is wired into `@vitejs/plugin-react` in
`vite.config.ts`. It memoizes components and values automatically at build
time. This changes how you should write React here:

- **Do not** use `useCallback`, `useMemo`, or `React.memo`. The compiler
  makes them redundant. Write plain functions and plain values; if you see
  manual memoization in a diff, it is almost certainly wrong for this
  codebase. (Narrow exception: a `useCallback` whose identity gates a ref
  callback, as in `project-row.tsx`'s edit-input focus.)
- Event handlers are plain inline functions or plain `const` functions in
  the component body — no wrapping, no dependency arrays.
- The one thing the compiler needs in return: follow the Rules of React. No
  mutating props/state, no side effects during render, hooks only at the top
  level. `eslint-plugin-react-hooks` (the `recommended-latest` config in
  `eslint.config.js`) includes the compiler's lint rules and will flag
  violations — a flagged component is silently skipped by the compiler
  rather than broken, but fix the violation instead of working around it.
- A function that calls no hooks is not a hook: don't give it a `use`
  prefix; lint flags unnecessary `use` prefixes.

## Data layer (TinyBase)

- Schema in `src/store/schema.ts`: tables `lists {kind, name, position}` and
  `todos {title, isCompleted, listId, position, projectId}`, plus UI values
  (`sidebarWidth`, `projectWidth`). A todo _shows_ in exactly one list
  (`listId` + fractional `position`) and _belongs_ to a project
  (`projectId`) — scheduling onto Today never touches `projectId`.
- `src/store/store-provider.tsx` creates the store, indexes (`todosByList`,
  `listsByKind` — ordered views come from their slices), checkpoints, and a
  localStorage persister. Children render only after persisted data loads.
  The Today list row is a structural invariant, restored on load if missing.
- All mutations live in `src/store/operations/` (`lists.ts`, `todos.ts`);
  components never write cells directly. `moveTodo(db, todoId, listId,
index?)` is the single mutation for drops; its `index` is relative to the
  target list **without** the dragged todo. Ordering uses fractional
  positions (midpoint inserts, no renumbering).
- Hooks come from `src/store/hooks.ts` (the single schema-typed cast of
  `tinybase/ui-react/with-schemas`); `useDb()` bundles store + indexes for
  the operations layer.
- Checkpoints are the undo mechanism. A drag is one undo step:
  `addCheckpoint()` at drag start, `goTo(preDragId)` on cancel,
  `addCheckpoint("Move task")` on drop.
- Verify TinyBase APIs against `node_modules/tinybase/agents.md` and
  `node_modules/tinybase/@types/` — do not trust training data.
- Ephemeral UI state (todo selection, in-flight pane widths) is plain React
  state; persistent UI state goes in TinyBase values.

## Drag and drop (@dnd-kit/react)

`@dnd-kit/react` + `@dnd-kit/helpers`, exact-pinned at 0.5.0 — a fast-moving
0.x rewrite. The installed type declarations are the source of truth, not
docs or memory.

- Two independent `DragDropProvider`s: tasks in `focus-screen.tsx`, project
  reordering in `sidebar/project-list.tsx`.
- Rows are `useSortable` (`id`, `index`, `group` = list id, `type`/`accept`).
  Clone feedback is per-entity plugin config —
  `plugins: (defaults) => [...defaults, Feedback.configure({feedback:
"clone"})]` — because 0.5.0 has no top-level `feedback` input.
- Panes are plain `useDroppable` targets with `CollisionPriority.Low` so
  hovered rows win.
- TinyBase is the source of truth mid-drag
  (`components/task-list/use-task-dnd.ts`): row hovers commit real moves
  through `move()` from `@dnd-kit/helpers` on `dragover`; pane hovers
  (padding, empty lists) place by row midlines and also commit on
  `dragmove`, because `dragover` only fires when the hovered target changes
  and `move()`'s own pane handling splits at the pane's center (wrong for
  full-height panes). Never `preventDefault()` a dragmove — it freezes the
  drag.
- Mid-drag the library floats the real row (`data-dnd-dragging`) and keeps
  an inert clone in the flow (`data-dnd-placeholder`). Style those states
  with Tailwind data variants on the row element (see
  `task-list/task-row.tsx`); React-conditional classes won't work because
  attribute changes are mirrored onto the clone.

## Other conventions

- **Prettier, no semicolons** — `.prettierrc` sets `semi: false`. Run
  `npm run format` after edits.
- **Strict, type-aware linting** — typescript-eslint `strictTypeChecked` +
  `stylisticTypeChecked`, plus `@eslint-react` and `jsx-a11y`:
  - No non-null assertions (`!`); narrow with a check or throw.
  - Interactive elements need accessible names and keyboard handling
    (jsx-a11y is strict about roles: e.g. an `li` may be `role="option"`,
    not `role="button"`).
- **Components** are grouped by feature under `src/components/`
  (`sidebar/`, `panes/`, `task-list/`). Default exports, kebab-case
  filenames.
- **Domain hooks are co-located with their component.** A hook that is
  specific to one component — not reusable across components — lives in that
  component's feature folder (e.g. `src/components/task-list/use-task-dnd.ts`
  next to `task-list.tsx`). Only generic hooks with no ties to a single
  component belong in `src/hooks/`.
- **Dialogs are per-entity** (`new-task-dialog.tsx`, `new-project-dialog.tsx`)
  — no shared generic name-prompt dialog.
- Generic presentational primitives (buttons, menus, separators) live in
  `src/ui/`.
