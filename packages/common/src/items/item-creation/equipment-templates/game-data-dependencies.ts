// everything game-data.generated.ts refers to, so the emitter writes one import line instead of
// carrying a copy of these paths. move any of these files and the compiler points here
export {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../../../combat/hp-change-source-types.js";
export { KineticDamageType } from "../../../combat/kinetic-damage-types.js";
export { MagicalElement } from "../../../combat/magical-elements.js";
export { CombatAttribute } from "../../../combatants/attributes/index.js";
export { NumberRange } from "../../../primatives/number-range.js";
export { AffixType } from "../../equipment/affixes.js";
export { ArmorCategory } from "../../equipment/equipment-properties/armor-properties.js";
export { ShieldSize } from "../../equipment/equipment-properties/shield-properties.js";
export { EquipmentType } from "../../equipment/equipment-types/index.js";
export { BodyArmor } from "../../equipment/equipment-types/body-armor.js";
export { HeadGear } from "../../equipment/equipment-types/head-gear.js";
export { Amulet, Ring } from "../../equipment/equipment-types/jewelry.js";
export { OneHandedMeleeWeapon } from "../../equipment/equipment-types/one-handed-melee-weapon.js";
export { Shield } from "../../equipment/equipment-types/shield.js";
export { TwoHandedMeleeWeapon } from "../../equipment/equipment-types/two-handed-melee-weapon.js";
export { TwoHandedRangedWeapon } from "../../equipment/equipment-types/two-handed-ranged-weapon.js";

// type-only: the repository imports the generated module, so a value import would close a cycle
export type { EquipmentTemplateSpec } from "./equipment-template-catalog.js";
