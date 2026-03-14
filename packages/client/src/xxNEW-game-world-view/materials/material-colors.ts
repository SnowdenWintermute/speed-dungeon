import { Color3 } from "@babylonjs/core";
import { MagicalElement } from "@speed-dungeon/common";

export enum MaterialCategory {
  Default,
  Wood,
  Metal,
  Plastic,
  Accent,
  Element,
  Custom,
}

export const MATERIAL_CATEGORY_STRINGS: Record<MaterialCategory, string> = {
  [MaterialCategory.Default]: "Default",
  [MaterialCategory.Wood]: "Wood",
  [MaterialCategory.Metal]: "Metal",
  [MaterialCategory.Plastic]: "Plastic",
  [MaterialCategory.Accent]: "Accent",
  [MaterialCategory.Element]: "Element",
  [MaterialCategory.Custom]: "Custom",
};

export enum MaterialLabel {
  Main,
  Alternate,
  Accent1,
  Accent2,
  Accent3,
  Handle,
  Hilt,
  Blade,
}

export const MATERIAL_LABEL_STRINGS: Record<MaterialLabel, string> = {
  [MaterialLabel.Main]: "Main",
  [MaterialLabel.Alternate]: "Alternate",
  [MaterialLabel.Accent1]: "Accent1",
  [MaterialLabel.Accent2]: "Accent2",
  [MaterialLabel.Accent3]: "Accent3",
  [MaterialLabel.Handle]: "Handle",
  [MaterialLabel.Hilt]: "Hilt",
  [MaterialLabel.Blade]: "Blade",
};

export const DEFAULT_MATERIAL_COLORS: Record<MaterialLabel, Color3> = {
  [MaterialLabel.Main]: new Color3(0.792, 0.761, 0.694),
  [MaterialLabel.Alternate]: new Color3(0.259, 0.208, 0.18),
  [MaterialLabel.Accent1]: new Color3(0.482, 0.486, 0.467),
  [MaterialLabel.Accent2]: new Color3(0.278, 0.518, 0.447),
  [MaterialLabel.Accent3]: new Color3(0.169, 0.145, 0.11),
  [MaterialLabel.Handle]: new Color3(0.2, 0.204, 0.204),
  [MaterialLabel.Hilt]: new Color3(0.6, 0.6, 0.55),
  [MaterialLabel.Blade]: new Color3(0.71, 0.694, 0.682),
};

export enum MaterialShade {
  Lightest,
  Lighter,
  Medium,
  Darker,
  Darkest,
}

export const MATERIAL_SHADE_STRINGS: Record<MaterialShade, string> = {
  [MaterialShade.Lightest]: "Lightest",
  [MaterialShade.Lighter]: "Lighter",
  [MaterialShade.Medium]: "Medium",
  [MaterialShade.Darker]: "Darker",
  [MaterialShade.Darkest]: "Darkest",
};

export const WOOD_COLORS: Record<MaterialShade, Color3> = {
  [MaterialShade.Lightest]: new Color3(0.722, 0.612, 0.463),
  [MaterialShade.Lighter]: new Color3(0.431, 0.365, 0.298),
  [MaterialShade.Medium]: new Color3(0.396, 0.322, 0.275),
  [MaterialShade.Darker]: new Color3(0.294, 0.224, 0.176),
  [MaterialShade.Darkest]: new Color3(0.125, 0.106, 0.086),
};

export const METAL_COLORS: Record<MaterialShade, Color3> = {
  [MaterialShade.Lightest]: new Color3(0.71, 0.694, 0.682),
  [MaterialShade.Lighter]: new Color3(0.588, 0.553, 0.553),
  [MaterialShade.Medium]: new Color3(0.306, 0.298, 0.306),
  [MaterialShade.Darker]: new Color3(0.125, 0.129, 0.133),
  [MaterialShade.Darkest]: new Color3(0.07, 0.11, 0.09),
};

export enum PlasticColor {
  Orange,
  Yellow,
  White,
  Blue,
}

export const PLASTIC_COLOR_STRINGS: Record<PlasticColor, string> = {
  [PlasticColor.Orange]: "Orange",
  [PlasticColor.Yellow]: "Yellow",
  [PlasticColor.White]: "White",
  [PlasticColor.Blue]: "Blue",
};

export const PLASTIC_COLORS: Record<PlasticColor, Color3> = {
  [PlasticColor.Orange]: new Color3(0.973, 0.608, 0.204),
  [PlasticColor.Yellow]: new Color3(0.969, 0.773, 0.196),
  [PlasticColor.White]: new Color3(0.859, 0.855, 0.839),
  [PlasticColor.Blue]: new Color3(0.004, 0.435, 0.729),
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
  MPBlue,
}

export const ACCENT_COLOR_STRINGS: Record<AccentColor, string> = {
  [AccentColor.Rose]: "Rose",
  [AccentColor.Brass]: "Brass",
  [AccentColor.Cherry]: "Cherry",
  [AccentColor.BurntOrange]: "BurntOrange",
  [AccentColor.KellyGreen]: "KellyGreen",
  [AccentColor.CobaltBlue]: "CobaltBlue",
  [AccentColor.DarkBlue]: "DarkBlue",
  [AccentColor.HPGreen]: "HPGreen",
  [AccentColor.MPBlue]: "MPBlue",
};

export const ACCENT_COLORS: Record<AccentColor, Color3> = {
  [AccentColor.Rose]: new Color3(0.557, 0.365, 0.318),
  [AccentColor.Brass]: new Color3(0.518, 0.369, 0.227),
  [AccentColor.Cherry]: new Color3(0.643, 0.278, 0.298),
  [AccentColor.BurntOrange]: new Color3(0.616, 0.404, 0.247),
  [AccentColor.KellyGreen]: new Color3(0.361, 0.608, 0.494),
  [AccentColor.CobaltBlue]: new Color3(0.165, 0.392, 0.58),
  [AccentColor.DarkBlue]: new Color3(0.071, 0.208, 0.322),
  [AccentColor.HPGreen]: new Color3(0.082, 0.502, 0.239),
  [AccentColor.MPBlue]: new Color3(0.114, 0.306, 0.847),
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

export enum CustomMaterial {
  Ether,
  Ice,
  AncientMetal,
}
