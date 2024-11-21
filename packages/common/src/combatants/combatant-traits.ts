import { PhysicalDamageType, formatPhysicalDamageType } from "../combat/hp-change-source-types.js";
import { MagicalElement, formatMagicalElement } from "../combat/magical-elements.js";

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
  let affinityOrResistance, percentToShow;
  switch (trait.type) {
    case CombatantTraitType.HpBioavailability:
      return `Hp Bioavailability ${trait.percent}%`;
    case CombatantTraitType.MpBioavailability:
      return `Mp Bioavailability ${trait.percent}%`;
    case CombatantTraitType.ElementalAffinity:
      affinityOrResistance = trait.percent > 100 ? "affinity" : "resistance";
      percentToShow = trait.percent > 100 ? trait.percent - 100 : trait.percent;
      return `${formatMagicalElement(trait.element)} ${affinityOrResistance} ${percentToShow}%`;
    case CombatantTraitType.Undead:
      return "Undead";
    case CombatantTraitType.PhysicalDamageTypeResistance:
      affinityOrResistance = trait.percent > 100 ? "affinity" : "resistance";
      percentToShow = trait.percent > 100 ? trait.percent - 100 : trait.percent;
      return `${formatPhysicalDamageType(trait.damageType)} ${affinityOrResistance} ${percentToShow}%`;
  }
}
