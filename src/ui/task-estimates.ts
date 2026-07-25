// What a task costs, as a small set of choices rather than a number of
// minutes: three durations on a difficulty scale, then kinds of work whose
// cost isn't a duration at all. Stored as a string key, so the catalog can
// grow new kinds without the document knowing anything about them.

interface TaskEstimateOption {
  // Badge colors. The durations run green → amber → red so a glance down the
  // list reads as "how hard is this"; the kinds sit off that scale.
  className: string
  // What the badge prints. Kept to three or four characters, so every badge
  // is the same width and the titles beside them stay in one column.
  label: string
  // What the menu calls it — the only place the full word appears.
  name: string
}

// The keys are what lands in the `estimate` cell, so renaming one orphans
// every task already wearing it; add and retire keys instead. The order is
// the order the menu offers them.
const ESTIMATES = {
  "10m": {
    className: "bg-emerald-100 text-emerald-700",
    label: "10m",
    name: "10 minutes",
  },
  "30m": {
    className: "bg-amber-100 text-amber-700",
    label: "30m",
    name: "30 minutes",
  },
  "60m": {
    className: "bg-red-100 text-red-700",
    label: "60m",
    name: "60 minutes",
  },
  project: {
    className: "bg-violet-100 text-violet-700",
    label: "proj",
    name: "Project",
  },
  errand: {
    className: "bg-cyan-100 text-cyan-700",
    label: "move",
    name: "Errand",
  },
  call: {
    className: "bg-indigo-100 text-indigo-700",
    label: "call",
    name: "Phone call",
  },
} satisfies Record<string, TaskEstimateOption>

// The same table for reading, keyed by anything: an `estimate` cell holds
// whatever some version of the app once wrote there, so a lookup has to be
// allowed to miss.
export const TASK_ESTIMATES: Record<string, TaskEstimateOption> = ESTIMATES

// What a task with no estimate wears — and what one naming an option this
// version has retired falls back to. It is a drawable option like any other
// rather than an absence, so the badge holds its place in every row and the
// titles beside it line up whether a task has been estimated or not.
export const NO_ESTIMATE: TaskEstimateOption = {
  className: "text-neutral-300",
  label: "–",
  name: "No estimate",
}

// Which estimate a task is *actually* wearing, the counterpart of
// displayName() for names and projectIcon() for icons: absent and
// unrecognized resolve the same way, in one place, so no caller re-derives
// the fallback.
export function taskEstimate(estimateName?: string): TaskEstimateOption {
  return TASK_ESTIMATES[estimateName ?? ""] ?? NO_ESTIMATE
}
