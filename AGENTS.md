# Agent Instructions

After finishing and verifying a task, automatically commit only the changes made for that task and push the commit to the current remote branch in the background. Do not include unrelated or pre-existing changes. If committing or pushing fails, report the failure to the user.

## About this project

A local-first todo app: React 19 + Vite + Tailwind v4, Dexie (IndexedDB) for
domain data, Zustand for UI state, dnd-kit for drag and drop.

## React Compiler is enabled

This project uses the React Compiler (`babel-plugin-react-compiler`, wired into
`@vitejs/plugin-react` in `vite.config.ts`). It memoizes components and values
automatically at build time. This changes how you should write React here:

- **Do not** use `useCallback`, `useMemo`, or `React.memo`. The compiler makes
  them redundant. Write plain functions and plain values; if you see manual
  memoization in a diff, it is almost certainly wrong for this codebase.
- Event handlers are plain inline functions or plain `const` functions in the
  component body — no wrapping, no dependency arrays.
- The one thing the compiler needs in return: follow the Rules of React. No
  mutating props/state, no side effects during render, hooks only at the top
  level. `eslint-plugin-react-hooks` (the `recommended-latest` config in
  `eslint.config.js`) includes the compiler's lint rules and will flag
  violations — a flagged component is silently skipped by the compiler rather
  than broken, but fix the violation instead of working around it.
- A function that calls no hooks is not a hook: don't give it a `use` prefix.
  Plain domain helpers live in `src/lib/` (see `src/lib/reorder-projects.ts`);
  lint flags unnecessary `use` prefixes.
- If a memoization escape hatch ever seems genuinely necessary, stop and
  reconsider the data flow first; it almost never is in this app.

## Other conventions

- **Prettier, no semicolons** — `.prettierrc` sets `semi: false`. Run
  `npm run format` after edits; `prettier --check .` must pass.
- **Strict, type-aware linting** — ESLint runs typescript-eslint
  `strictTypeChecked` + `stylisticTypeChecked` (with `projectService`), plus
  `@eslint-react` and `jsx-a11y`. Practical consequences:
  - Fire-and-forget promises (Dexie writes in event handlers) must be
    explicitly discarded: `onClick={() => { void db.todos.delete(id) }}`.
    Never pass an async function where a `() => void` is expected — widen the
    prop type to `() => void | Promise<void>` instead.
  - No non-null assertions (`!`); narrow with a check or throw.
  - Interactive elements need accessible names (`aria-label` etc.).
- **State split**: persistent domain data (todos, projects) lives in Dexie
  (`src/db.ts`), read reactively via `useLiveQuery`. Ephemeral UI state
  (selection, pane widths) lives in the Zustand store
  (`src/stores/ui-store.ts`). Don't move domain data into Zustand.
- **Dexie schema changes** are additive: never edit an existing
  `db.version(n)` block — add a new version with an `.upgrade()` migration.
  Projects carry a persisted `order` field (sidebar ordering); new projects
  append at `max(order) + 1`.
- **Components** are grouped by feature under `src/components/`
  (e.g. `sidebar/`, `panes/`). Default exports, kebab-case filenames.
- **Drag and drop** uses dnd-kit with the `DragOverlay` pattern: a
  presentational preview component with `placeholder`/`overlay` states
  (`sidebar/project-row-preview.tsx`), a thin `useSortable` row wrapper, and a
  `DndContext` in the list component. Follow the same shape for new sortable
  lists.
- Verify with `npx tsc -b && npm run lint && npx prettier --check .`.
