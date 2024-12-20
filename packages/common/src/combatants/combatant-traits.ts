import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { HoldableHotswapSlot } from "./combatant-equipment/index.js";

export enum CombatantTraitType {
  HpBioavailability,
  MpBioavailability,
  ElementalAffinity,
  Undead,
  KineticDamageTypeResistance,
  ExtraHotswapSlot,
}

export interface TraitHpBioavailability {
  type: CombatantTraitType.HpBioavailability;
  percent: number;
}

export interface TraitMpBioavailability {
  type: CombatantTraitType.MpBioavailability;
  percent: number;
}

export interface TraitElementalAffinity {
  type: CombatantTraitType.ElementalAffinity;
  element: MagicalElement;
  percent: number;
}

export interface TraitPhysicalDamageTypeResistance {
  type: CombatantTraitType.KineticDamageTypeResistance;
  damageType: KineticDamageType;
  percent: number;
}

export interface TraitUndead {
  type: CombatantTraitType.Undead;
}

export interface TraitExtraHotswapSlot {
  type: CombatantTraitType.ExtraHotswapSlot;
  hotswapSlot: HoldableHotswapSlot;
}

export type CombatantTrait =
  | TraitHpBioavailability
  | TraitMpBioavailability
  | TraitElementalAffinity
  | TraitPhysicalDamageTypeResistance
  | TraitUndead
  | TraitExtraHotswapSlot;

export const TRAIT_DESCRIPTIONS: Record<CombatantTraitType, string> = {
  [CombatantTraitType.HpBioavailability]: "Effectiveness of HP Autoinjectors",
  [CombatantTraitType.MpBioavailability]: "Effectiveness of MP Autoinjectors",
  [CombatantTraitType.ElementalAffinity]:
    "Resistance or weakness to this element. If above 100%, actions of this element will cause healing instead of damage.",
  [CombatantTraitType.Undead]: "Healing magic damages this target",
  [CombatantTraitType.KineticDamageTypeResistance]: "Resistance or weakness to this damage type",
  [CombatantTraitType.ExtraHotswapSlot]:
    "Adds an additional weapon swap slot - 'You know I keep that mf thang on me'",
};
