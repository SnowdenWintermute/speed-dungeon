import { PhysicalDamageType, formatPhysicalDamageType } from "../combat/hp-change-source-types";
import { MagicalElement, formatMagicalElement } from "../combat/magical-elements";

export enum CombatantTraitType {
  HpBioavailability,
  MpBioavailability,
  ElementalAffinity,
  Undead,
  PhysicalDamageTypeResistance,
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
  type: CombatantTraitType.PhysicalDamageTypeResistance;
  damageType: PhysicalDamageType;
  percent: number;
}

export interface TraitUndead {
  type: CombatantTraitType.Undead;
}

export type CombatantTrait =
  | TraitHpBioavailability
  | TraitMpBioavailability
  | TraitElementalAffinity
  | TraitPhysicalDamageTypeResistance
  | TraitUndead;

export const TRAIT_DESCRIPTIONS: Record<CombatantTraitType, string> = {
  [CombatantTraitType.HpBioavailability]: "Effectiveness of HP Autoinjectors",
  [CombatantTraitType.MpBioavailability]: "Effectiveness of MP Autoinjectors",
  [CombatantTraitType.ElementalAffinity]:
    "Resistance or weakness to this element. If above 100%, actions of this element will cause healing instead of damage.",
  [CombatantTraitType.Undead]: "Healing magic damages this target",
  [CombatantTraitType.PhysicalDamageTypeResistance]: "Resistance or weakness to this damage type",
};

export function formatCombatantTrait(trait: CombatantTrait): string {
  switch (trait.type) {
    case CombatantTraitType.HpBioavailability:
      return `Hp Bioavailability ${trait.percent}%`;
    case CombatantTraitType.MpBioavailability:
      return `Mp Bioavailability ${trait.percent}%`;
    case CombatantTraitType.ElementalAffinity:
      return `${formatMagicalElement(trait.element)} affinity ${trait.percent}%`;
    case CombatantTraitType.Undead:
      return "Undead";
    case CombatantTraitType.PhysicalDamageTypeResistance:
      return `${formatPhysicalDamageType(trait.damageType)} affinity ${trait.percent}%`;
  }
}
