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

// Named because it is also what an unrecognized icon falls back to, below.
const FOLDER: ProjectIconOption = { Icon: Folder, label: "Folder" }

// The icons a project can wear, in the order the picker shows them (loosely
// grouped: work, learning, making, home, body, odds and ends). Two dozen fits
// four rows of six with no scrolling — a list you can scan rather than search.
//
// The keys are what lands in the `icon` cell, so renaming one orphans every
// project already wearing it; add and retire icons instead. The labels are the
// only name a screen reader gets for a tile.
export const PROJECT_ICONS: Record<string, ProjectIconOption> = {
  folder: FOLDER,
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
}

// What a project with no icon of its own shows, and the tile the picker marks
// as current for it.
export const DEFAULT_PROJECT_ICON = "folder"

// What to draw for a project, the counterpart of displayName() for names: the
// `icon` cell is optional and nothing stops an older document from naming an
// icon this version has retired, so both resolve to the folder rather than
// leaving a hole in the row. Callers render `option.Icon` straight from the
// entry — pulling the component out into a local of its own is what the
// static-components lint rule is there to stop.
export function projectIcon(iconName: string | undefined): ProjectIconOption {
  const option = iconName === undefined ? undefined : PROJECT_ICONS[iconName]
  return option ?? FOLDER
}
