import { AbstractMesh, Color3, MultiMaterial } from "@babylonjs/core";

export function lighten(color: Color3, amount: number): Color3 {
  return Color3.Lerp(color, Color3.White(), amount);
}

export function darken(color: Color3, amount: number): Color3 {
  return Color3.Lerp(color, Color3.Black(), amount);
}

export function desaturate(color: Color3, amount: number): Color3 {
  const gray = new Color3(
    (color.r + color.g + color.b) / 3,
    (color.r + color.g + color.b) / 3,
    (color.r + color.g + color.b) / 3
  );
  return Color3.Lerp(color, gray, amount);
}
