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
