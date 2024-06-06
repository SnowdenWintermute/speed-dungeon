export enum MagicalElement {
  Fire,
  Ice,
  Lightning,
  Water,
  Earth,
  Wind,
  Dark,
  Light,
}

export function formatMagicalElement(element: MagicalElement) {
  switch (element) {
    case MagicalElement.Fire:
      return "Fire";
    case MagicalElement.Ice:
      return "Ice";
    case MagicalElement.Lightning:
      return "Lightning";
    case MagicalElement.Water:
      return "Water";
    case MagicalElement.Earth:
      return "Earth";
    case MagicalElement.Wind:
      return "Wind";
    case MagicalElement.Dark:
      return "Dark";
    case MagicalElement.Light:
      return "Light";
  }
}
