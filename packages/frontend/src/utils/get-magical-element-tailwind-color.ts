import { MagicalElement } from "@speed-dungeon/common";

const magicalElementTailwindColor: Record<MagicalElement, string> = {
  [MagicalElement.Fire]: "bg-firered",
  [MagicalElement.Ice]: "bg-iceblue",
  [MagicalElement.Lightning]: "bg-lightningpurple",
  [MagicalElement.Water]: "bg-waterblue",
  [MagicalElement.Earth]: "bg-earthyellow text-slate-700",
  [MagicalElement.Wind]: "bg-windgreen text-slate-700",
  [MagicalElement.Dark]: "bg-darknessblack",
  [MagicalElement.Light]: "bg-lightwhite text-slate-700",
};

export default function getMagicalElementTailwindColor(element: MagicalElement) {
  return magicalElementTailwindColor[element];
}

export const MAGICAL_ELEMENT_ICON_TAILWIND_STYLES: Record<MagicalElement, string> = {
  [MagicalElement.Fire]: "bg-firered fill-zinc-300",
  [MagicalElement.Ice]: "bg-iceblue fill-zinc-300",
  [MagicalElement.Lightning]: "bg-lightningpurple stroke-zinc-300 ",
  [MagicalElement.Water]: "bg-waterblue fill-slate-400",
  [MagicalElement.Earth]: "bg-earthyellow fill-slate-700",
  [MagicalElement.Wind]: "bg-windgreen stroke-zinc-300",
  [MagicalElement.Dark]: "bg-darknessblack fill-slate-700 stroke-slate-700",
  [MagicalElement.Light]: "fill-zinc-300 bg-lightwhite",
};
