# Agent Instructions

## About this project

A local-first todo app ("focuslist"): a Today list plus per-project lists.
React 19 + Vite + TypeScript (strict, `noUncheckedIndexedAccess`) + Tailwind
v4, TinyBase v9 for the document, Zustand for UI state, `@dnd-kit/react` for
drag and drop, `@base-ui/react` for menus and dialogs. No router.

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
- The user edits the tree while you work. When `git status` shows files you
  did not touch, stage your own paths explicitly instead of `git add -A`.
- Verify with `npm run build && npm run lint && npx prettier --check .` —
  all must pass clean before committing. Don't pipe those through `tail`;
  it swallows the exit code.

## React Compiler is enabled

`babel-plugin-react-compiler` memoizes components and values at build time,
which changes how to write React here:

- **Do not** use `useCallback`, `useMemo`, or `React.memo`. Write plain
  functions and plain values; manual memoization in a diff is almost
  certainly wrong for this codebase. (Narrow exception: a `useCallback` whose
  identity gates a ref callback, as in `use-inline-rename.ts`.)
- Follow the Rules of React in return. No mutating props/state, no side
  effects during render, hooks only at the top level.
  `eslint-plugin-react-hooks` includes the compiler's lint rules — fix what
  it flags rather than working around it. A flagged component is silently
  skipped by the compiler.
- A function that calls no hooks is not a hook: don't give it a `use` prefix.

## Data layer (TinyBase for the document, Zustand for the UI)

- All mutations live in `src/store/operations/`; components never write
  cells directly. The layer holds rules, not just writes — what a piece of
  state _means_ belongs there too, so a menu and the keyboard get the same
  answer.
- Every user action seals exactly one undo step via `asUndoStep`. Building
  blocks a gesture calls repeatedly leave sealing to the gesture. Never seal
  on the way _into_ an action: a checkpoint taken before changing anything
  undoes nothing, which reads as a dead keypress. `operations/undo.ts` is
  the only module that touches checkpoints.
- Ordering uses fractional positions (midpoint inserts, no renumbering).
- Hooks come from `src/store/hooks.ts`, the single schema-typed cast of
  `tinybase/ui-react/with-schemas`. TinyBase's row/cell _writing_ hooks are
  deliberately not re-exported there — a component has nothing to reach for
  but the operations.
- Keep the document to tables. The values schema is empty on purpose, so a
  checkpoint is document state and nothing else and undo cannot rewind the
  way the app looks.
- UI state that only one component needs (an in-flight drag width, an edit
  draft) is plain React state. Everything else about how the app looks lives
  in `src/store/ui-store.ts` — including anything a second component could
  need to open, close, or address. Components read it with
  `useUiStore(selector)` or a named reader in `src/hooks/`; the operations
  layer reads it outside React through `uiState()`. Selectors must return
  primitives, never fresh objects.
- Session state (selection, edit mode, open editor, open picker) is simply
  not persisted; only chrome goes in `partialize`. Every id resolves against
  the document, so a stale one is inert and needs no cleanup.
- Verify TinyBase APIs against `node_modules/tinybase/agents.md` and
  `node_modules/tinybase/@types/` — do not trust training data.

## Drag and drop (@dnd-kit/react)

`@dnd-kit/react` + `@dnd-kit/helpers`, exact-pinned at 0.5.0 — a fast-moving
0.x rewrite. The installed type declarations are the source of truth, not
docs or memory.

- Placement rules must depend only on the dragged card's rectangle, never on
  which list currently holds the row, so repeated commits can't oscillate.
- Never `preventDefault()` a dragmove — it freezes the drag.
- Style the dragging and placeholder states with Tailwind data variants
  (`data-[dnd-dragging]`, `data-[dnd-placeholder]`) on the row element.
  React-conditional classes won't work: attribute changes are mirrored onto
  the clone.

## Other conventions

- **Prettier, no semicolons** — `.prettierrc` sets `semi: false`. Run
  `npm run format` after edits.
- **Strict, type-aware linting** — typescript-eslint `strictTypeChecked` +
  `stylisticTypeChecked`, plus `@eslint-react` and `jsx-a11y`:
  - No non-null assertions (`!`); narrow with a check or throw.
  - Interactive elements need accessible names and keyboard handling
    (jsx-a11y is strict about roles: e.g. an `li` may be `role="option"`,
    not `role="button"`).
  - Don't hoist a looked-up component into a local (`const Icon = f(x)`) —
    `static-components` flags it. Render it off the entry: `<icon.Icon />`.
- **No focus rings anywhere** (see `src/index.css`). Selection is what the
  app draws; where the keyboard is takes the same grey a hover does.
- **Components** are grouped by feature under `src/components/`
  (`sidebar/`, `panes/`, `task-list/`). Default exports, kebab-case
  filenames. Generic presentational primitives live in `src/ui/`.
- **Domain hooks are co-located with their component.** A hook specific to
  one component lives in that component's feature folder; only generic hooks
  with no ties to a single component belong in `src/hooks/`.
- **Creation is inline, never a dialog.** "New project" and "New task"
  create an untitled row right away and open its inline editor, by setting
  the edit value in the same transaction as the insert. Both rows rename
  through one `ui/inline-edit-input.tsx`, which owns the draft and the rule
  for what is worth committing. Double-click starts a rename.
- **Anything absent resolves to something drawable, in one place.** A name
  goes through `displayName()` (`ui/display-name.ts`), a project's icon
  through `projectIcon()` (`ui/project-icons.ts`), so an unnamed row or an
  unrecognized icon key looks the same everywhere and no caller re-derives
  the fallback.
