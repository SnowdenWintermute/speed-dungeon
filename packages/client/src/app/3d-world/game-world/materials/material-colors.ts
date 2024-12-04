import { Color3 } from "@babylonjs/core";
import { MagicalElement } from "@speed-dungeon/common";

export const DEFAULT_MATERIAL_COLORS: { [name: string]: Color3 } = {
  Main: new Color3(0.792, 0.761, 0.694),
  Alternate: new Color3(0.259, 0.208, 0.18),
  Accent1: new Color3(0.482, 0.486, 0.467),
  Accent2: new Color3(0.278, 0.518, 0.447),
  Handle: new Color3(0.169, 0.145, 0.11),
  Hilt: new Color3(0.2, 0.204, 0.204),
  Blade: new Color3(0.6, 0.6, 0.55),
};

export enum LightestToDarkest {
  Lightest,
  Lighter,
  Medium,
  Darker,
  Darkest,
}
export function formatLightestToDarkest(enumMember: LightestToDarkest) {
  switch (enumMember) {
    case LightestToDarkest.Lightest:
      return "Lightest";
    case LightestToDarkest.Lighter:
      return "Lighter";
    case LightestToDarkest.Medium:
      return "Medium";
    case LightestToDarkest.Darker:
      return "Darker";
    case LightestToDarkest.Darkest:
      return "Darkest";
  }
}

export const WOOD_COLORS: Record<LightestToDarkest, Color3> = {
  // [LightestToDarkest.Lightest]: new Color3(0.722, 0.612, 0.463),
  [LightestToDarkest.Lightest]: new Color3(0.722, 0.612, 0.463),
  // [LightestToDarkest.Lighter]: new Color3(0.447, 0.365, 0.282),
  [LightestToDarkest.Lighter]: new Color3(0.431, 0.365, 0.298),
  // [LightestToDarkest.Medium]: new Color3(0.435, 0.314, 0.235),
  [LightestToDarkest.Medium]: new Color3(0.396, 0.322, 0.275),
  [LightestToDarkest.Darker]: new Color3(0.294, 0.224, 0.176),
  [LightestToDarkest.Darkest]: new Color3(0.125, 0.106, 0.086),
};

export const METAL_COLORS: Record<LightestToDarkest, Color3> = {
  [LightestToDarkest.Lightest]: new Color3(0.71, 0.694, 0.682),
  [LightestToDarkest.Lighter]: new Color3(0.588, 0.553, 0.553),
  [LightestToDarkest.Medium]: new Color3(0.306, 0.298, 0.306),
  [LightestToDarkest.Darker]: new Color3(0.125, 0.129, 0.133),
  [LightestToDarkest.Darkest]: new Color3(0.07, 0.11, 0.09),
};

export enum PlasticColor {
  Orange,
  Yellow,
  White,
  Blue
}

export const PLASTIC_COLORS: Record<PlasticColor, Color3> = {
    [PlasticColor.Orange]: new Color3(0.973, 0.608, 0.204),
    [PlasticColor.Yellow]: new Color3(0.969, 0.773, 0.196),
    [PlasticColor.White]: new Color3(0.859, 0.855, 0.839),
    [PlasticColor.Blue]: new Color3(0.004, 0.435, 0.729)
};


export enum AccentColor {
  Rose,
  Brass,
  Cherry,
  BurntOrange,
  KellyGreen,
  CobaltBlue,
  DarkBlue,
  HPGreen,
  MPBlue
}

export const ACCENT_COLORS: Record<AccentColor, Color3> = {
    [AccentColor.Rose]: new Color3(0.557, 0.365, 0.318),
    [AccentColor.Brass]: new Color3(0.518, 0.369, 0.227),
    [AccentColor.Cherry]: new Color3(0.643, 0.278, 0.298),
    [AccentColor.BurntOrange]: new Color3(0.616, 0.404, 0.247),
    [AccentColor.KellyGreen]: new Color3(0.361, 0.608, 0.494),
    [AccentColor.CobaltBlue]: new Color3(0.165, 0.392, 0.58),
    [AccentColor.DarkBlue]: new Color3(0.071, 0.208, 0.322),
    [AccentColor.HPGreen]: new Color3(0.082, 0.502, 0.239),
    [AccentColor.MPBlue]: new Color3(0.114, 0.306, 0.847)
};

export const ELEMENT_COLORS: Record<MagicalElement, Color3> = {
  [MagicalElement.Fire]: new Color3(0.678, 0.145, 0.184),
  [MagicalElement.Ice]: new Color3(0.169, 0.592, 0.6),
  [MagicalElement.Lightning]: new Color3(0.439, 0.235, 0.569),
  [MagicalElement.Water]: new Color3(0.2, 0.18, 0.573),
  [MagicalElement.Earth]: new Color3(0.686, 0.663, 0.082),
  [MagicalElement.Wind]: new Color3(0.184, 0.667, 0.212),
  [MagicalElement.Dark]: new Color3(0.18, 0.145, 0.078),
  [MagicalElement.Light]: new Color3(0.655, 0.627, 0.553),
};

export const MATERIAL_NAMES = {
  MAIN: "Main",
  ALTERNATE: "Alternate",
  ACCENT_1: "Accent1",
  ACCENT_2: "Accent2",
  ACCENT_3: "Accent3",
  HANDLE: "Handle",
  HILT: "Hilt",
  BLADE: "Blade",
};

export enum CustomMaterial {
  Ether,
  Ice,
  AncientMetal,
}
