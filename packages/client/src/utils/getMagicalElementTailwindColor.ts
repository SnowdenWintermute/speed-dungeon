import { MagicalElement } from "@speed-dungeon/common";

export default function getMagicalElementTailwindColor(element: MagicalElement) {
  switch (element) {
    case MagicalElement.Fire:
      return "bg-firered";
    case MagicalElement.Ice:
      return "bg-iceblue";
    case MagicalElement.Lightning:
      return "bg-lightningpurple";
    case MagicalElement.Water:
      return "bg-waterblue";
    case MagicalElement.Earth:
      return "bg-earthyellow text-slate-700";
    case MagicalElement.Wind:
      return "bg-windgreen text-slate-700";
    case MagicalElement.Dark:
      return "bg-darknessblack";
    case MagicalElement.Light:
      return "bg-lightwhite text-slate-700";
  }
}

export const MAGICAL_ELEMENT_ICON_TAILWIND_STYLES: Record<MagicalElement, string> = {
  [MagicalElement.Fire]: "bg-firered fill-zinc-300",
  [MagicalElement.Ice]: "bg-iceblue fill-zinc-300",
  [MagicalElement.Lightning]: "bg-lightningpurple stroke-zinc-300",
  [MagicalElement.Water]: "bg-waterblue fill-slate-400",
  [MagicalElement.Earth]: "bg-earthyellow fill-slate-700",
  [MagicalElement.Wind]: "bg-windgreen stroke-zinc-300",
  [MagicalElement.Dark]: "bg-darknessblack fill-slate-700 stroke-slate-700",
  [MagicalElement.Light]: "fill-zinc-300 bg-lightwhite",
};
