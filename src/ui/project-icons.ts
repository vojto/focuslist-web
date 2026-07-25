import {
  BookOpen,
  Briefcase,
  Camera,
  Car,
  Code,
  Dog,
  Dumbbell,
  Folder,
  GraduationCap,
  Heart,
  House,
  Leaf,
  Lightbulb,
  Music,
  Palette,
  PenTool,
  Plane,
  Rocket,
  ShoppingCart,
  Star,
  Target,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react"

interface ProjectIconOption {
  Icon: LucideIcon
  label: string
}

// The icons a project can wear, in the order the picker shows them (loosely
// grouped: work, learning, making, home, body, odds and ends). Two dozen fits
// four rows of six with no scrolling — a list you can scan rather than search.
//
// The keys are what lands in the `icon` cell, so renaming one orphans every
// project already wearing it; add and retire icons instead. The labels are the
// only name a screen reader gets for a tile.
const ICONS = {
  folder: { Icon: Folder, label: "Folder" },
  briefcase: { Icon: Briefcase, label: "Briefcase" },
  target: { Icon: Target, label: "Target" },
  rocket: { Icon: Rocket, label: "Rocket" },
  lightbulb: { Icon: Lightbulb, label: "Lightbulb" },
  star: { Icon: Star, label: "Star" },

  book: { Icon: BookOpen, label: "Book" },
  graduation: { Icon: GraduationCap, label: "Graduation cap" },
  code: { Icon: Code, label: "Code" },
  palette: { Icon: Palette, label: "Palette" },
  pen: { Icon: PenTool, label: "Pen" },
  camera: { Icon: Camera, label: "Camera" },

  music: { Icon: Music, label: "Music" },
  house: { Icon: House, label: "House" },
  cart: { Icon: ShoppingCart, label: "Shopping cart" },
  utensils: { Icon: Utensils, label: "Utensils" },
  wallet: { Icon: Wallet, label: "Wallet" },
  plane: { Icon: Plane, label: "Plane" },

  car: { Icon: Car, label: "Car" },
  dumbbell: { Icon: Dumbbell, label: "Dumbbell" },
  heart: { Icon: Heart, label: "Heart" },
  leaf: { Icon: Leaf, label: "Leaf" },
  dog: { Icon: Dog, label: "Dog" },
  users: { Icon: Users, label: "People" },
} satisfies Record<string, ProjectIconOption>

// The same table for reading, keyed by anything: an `icon` cell holds whatever
// some version of the app once wrote there, so a lookup has to be allowed to
// miss. Writes go through the literal keys above, which is what makes
// DEFAULT_PROJECT_ICON below a name the catalog is known to have.
export const PROJECT_ICONS: Record<string, ProjectIconOption> = ICONS

// What a project with no icon of its own wears.
export const DEFAULT_PROJECT_ICON: keyof typeof ICONS = "folder"

// Which icon a project is *actually* wearing, the counterpart of displayName()
// for names: the `icon` cell is optional, and nothing stops a document written
// by a later version from naming an icon this one has retired, so both resolve
// to the default rather than leaving a hole in the row. Answered as a key,
// because the picker needs to know which tile to mark and the rule for that is
// this one — projectIcon() is the same answer as something to draw.
export function projectIconName(iconName: string = DEFAULT_PROJECT_ICON) {
  return iconName in PROJECT_ICONS ? iconName : DEFAULT_PROJECT_ICON
}

// Render `option.Icon` straight from the entry rather than hoisting it into a
// local of its own — that is what the static-components lint rule stops.
export function projectIcon(iconName?: string): ProjectIconOption {
  return PROJECT_ICONS[projectIconName(iconName)] ?? ICONS[DEFAULT_PROJECT_ICON]
}
