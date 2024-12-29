import { ArmorProperties } from "./armor-properties.js";
import { JewelryProperties } from "./jewelry-properties.js";
import { ShieldProperties } from "./shield-properties.js";
import { WeaponProperties } from "./weapon-properties.js";
export * from "./armor-properties.js";
export * from "./jewelry-properties.js";
export * from "./shield-properties.js";
export * from "./weapon-properties.js";

export type EquipmentBaseItemProperties =
  | ArmorProperties
  | WeaponProperties
  | ShieldProperties
  | JewelryProperties;
