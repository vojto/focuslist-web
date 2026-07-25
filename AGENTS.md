# Agent Instructions

## About this project

A local-first todo app ("focuslist"): a Today list plus per-project lists.
React 19 + Vite + TypeScript (strict, `noUncheckedIndexedAccess`) +
Tailwind v4. Domain data lives in TinyBase v9, persisted to localStorage.
Drag and drop uses `@dnd-kit/react` 0.5.0. There is no router — the
selected project is a store value (`selectedProjectId`); menus build on
`@base-ui/react`.

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
  unrelated edits pile up uncommitted. Do not wait for the user to look at
  the change first — a finished, clean-verifying task gets committed and
  pushed, and anything they want different afterwards is a follow-up commit.
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
  callback, as in `use-inline-rename.ts`'s edit-input focus.)
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

## Data layer (TinyBase for the document, Zustand for the UI)

- Schema in `src/store/schema.ts`: tables `lists {kind, name, position}` and
  `todos {title, isCompleted, listId, position, projectId}`, and an
  **empty values schema** — the document is tables and nothing else. A todo
  _shows_ in exactly one list (`listId` + fractional `position`) and
  _belongs_ to a project (`projectId`) — scheduling onto Today never touches
  `projectId`.
- `src/store/store-provider.tsx` creates the store, indexes (`todosByList`,
  `listsByKind` — ordered views come from their slices), checkpoints, and a
  localStorage persister. Children render only after persisted data loads.
  The Today list row is a structural invariant, restored on load if missing.
- All mutations live in `src/store/operations/` (`lists.ts`, `todos.ts`,
  `selection.ts`, `undo.ts`); components never write cells
  directly. `moveTodo(db, todoId, listId, index?)` is the single mutation for
  drops; its `index` is relative to the target list **without** the dragged
  todo. Ordering uses fractional positions (midpoint inserts, no
  renumbering).
- The layer holds rules, not just writes. `selection.ts` owns what the
  selection state _means_ — `selectedTodo(db)` resolves it (a selection
  naming a deleted row is no selection), and moving it by row, by pane, or
  off a row being deleted lives there too, so a menu and the keyboard get
  the same answer. `src/keyboard/commands.ts` is left as a registry of ids,
  titles and glue.
- Hooks come from `src/store/hooks.ts` (the single schema-typed cast of
  `tinybase/ui-react/with-schemas`); `useDb()` bundles store + indexes +
  checkpoints for the operations layer. TinyBase's row/cell writing hooks are
  deliberately not re-exported there, so a component has nothing to reach for
  but the operations.
- Checkpoints are the undo mechanism, and `operations/undo.ts` is the only
  module that touches them (`store-provider.tsx` aside, which creates them):
  a step is defined by when the app seals one, so a stray `addCheckpoint`
  elsewhere is a redefinition of what one undo step means. Every user action
  seals exactly one step via `asUndoStep(db, label, fn)`; the building blocks
  a drag calls dozens of times (`addTodo`, `moveTodo`, `reorderProjects`)
  leave sealing to the gesture, which uses `currentCheckpoint` at drag start,
  `revertTo` on cancel and `sealUndoStep` on drop. Nothing seals on the way
  _into_ an action — a checkpoint taken before changing anything is a step
  that undoes nothing, which reads to the user as a dead keypress. Undo is
  short because the store holds only the document: there is no selection or
  column width in a checkpoint to travel back to.
  `store-provider.tsx` calls `checkpoints.clear()` after the initial load so
  loading the document is not itself undoable.
- Verify TinyBase APIs against `node_modules/tinybase/agents.md` and
  `node_modules/tinybase/@types/` — do not trust training data.
- UI state that only one component needs (in-flight pane widths during a
  drag, an edit draft) is plain React state. Everything else about how the
  app looks lives in the Zustand store in `src/store/ui-store.ts`, **not** in
  TinyBase — that separation is what keeps undo from rewinding the selection
  or a pane width. Components read it with `useUiStore(selector)` (or the
  named readers in `src/hooks/`, e.g. `use-todo-selection.ts`) and write it
  with the plain functions the store exports (`selectTodo`, `editTodo`, …);
  the operations layer reads it outside React through `uiState()`. Selectors
  must return primitives, never fresh objects.
- Two lifetimes live in that store. Layout and `selectedProjectId` are the
  app's chrome and persist under their own key (`focuslist-ui`), via the
  `partialize` list; the selection and edit pairs are session state and are
  simply not persisted — no clearing on load needed. A todo's selection and
  edit mode are each an id/pane pair (`selectedTodoId` +
  `selectedTodoPaneId`, `editingTodoId` + `editingTodoPaneId`), so two panes
  can never both claim one; projects need no pane, there being one project
  list. Every pair resolves against the document, so a stale one — the row
  was deleted, the pane now shows another list — is inert and needs no
  cleanup.

## Drag and drop (@dnd-kit/react)

`@dnd-kit/react` + `@dnd-kit/helpers`, exact-pinned at 0.5.0 — a fast-moving
0.x rewrite. The installed type declarations are the source of truth, not
docs or memory.

- Two independent `DragDropProvider`s: tasks in `main-screen.tsx`, project
  reordering in `sidebar/project-list.tsx`.
- Rows are `useSortable` (`id`, `index`, `group` = list id, `type`/`accept`).
  Clone feedback is per-entity plugin config —
  `plugins: (defaults) => [...defaults, Feedback.configure({feedback:
"clone"})]` — because 0.5.0 has no top-level `feedback` input.
- Panes are plain `useDroppable` targets; task placement ignores the
  library's collision targets, but the pane/row droppable registrations are
  what the placement math reads its rectangles from.
- TinyBase is the source of truth mid-drag
  (`components/task-list/use-task-dnd.ts`): every `dragmove`/`dragover`
  runs one placement rule — the pane is chosen by rect overlap (the card
  moves to another pane once 30% of it sits over that pane, otherwise it
  stays with the drag-start list) and the slot within the pane by row
  midlines — and commits real moves. The rule depends only on the card's
  rectangle, never on which list currently holds the todo, so repeated
  commits can't oscillate. Never `preventDefault()` a dragmove — it
  freezes the drag.
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
- **Creation is inline, never a dialog.** "New project" and "New task"
  create an untitled row right away and open its inline editor, by setting
  the edit value in the same transaction as the insert. Both rows rename
  through one `ui/inline-edit-input.tsx`, which owns the draft and the rule
  for what is worth committing — an empty or unchanged draft commits
  nothing, so a row can stay untitled. Double-click starts a rename.
- **A project's icon is a catalog key, not a component.** The `icon` cell on
  `lists` holds a key from `sidebar/project-icons.ts`, which owns the two
  dozen icons offered and the rule for resolving one: `projectIcon()` answers
  with the folder for a project that has no icon _and_ for a key this version
  has retired, so the sidebar can never draw a hole. Render `option.Icon`
  from the entry — lifting the component into a local of its own is what the
  `static-components` lint rule stops. The picker
  (`sidebar/project-icon-dialog.tsx`, reached by right-clicking a project) is
  the app's one dialog, and it is a dialog because picking from a grid is not
  something a row can do inline; a pick commits and closes, so it needs no OK.
- **Unnamed rows show a placeholder, not an empty line.** Anything that
  renders a name runs it through `displayName()` in `ui/display-name.ts`
  (which also owns `PROJECT_PLACEHOLDER_NAME` / `TODO_PLACEHOLDER_TITLE`),
  so the gray "New Project" / "New Task" state looks the same in the
  sidebar, in a pane title, and in a task row.
- Generic presentational primitives (buttons, menus, separators) live in
  `src/ui/`.
