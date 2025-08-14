export * from "./combatant-trait-properties.js";
export * from "./get-combatant-total-elemental-affinities.js";
export * from "./get-combatant-total-kinetic-damage-type-affinities.js";

export enum CombatantTraitType {
  HpBioavailability,
  MpBioavailability,
  Undead,
  ExtraHotswapSlot,
  CanConvertToShardsManually,
  ExtraConsumablesStorage,
}

export interface CombatantTraitDescription {
  name: string;
  descriptionsByLevel: string[];
}

export const COMBATANT_TRAIT_DESCRIPTIONS: Record<CombatantTraitType, CombatantTraitDescription> = {
  [CombatantTraitType.HpBioavailability]: {
    name: "HP Bioavailability",
    descriptionsByLevel: ["Effectiveness of MP Autoinjectors"],
  },
  [CombatantTraitType.MpBioavailability]: {
    name: "MP Bioavailability",
    descriptionsByLevel: ["Effectiveness of MP Autoinjectors"],
  },
  [CombatantTraitType.Undead]: {
    name: "Undead",
    descriptionsByLevel: ["Healing magic damages this target"],
  },
  [CombatantTraitType.ExtraHotswapSlot]: {
    name: "Stay Strapped",
    descriptionsByLevel: [
      "Adds an additional weapon swap slot - 'You know I keep that thang on me'",
    ],
  },
  [CombatantTraitType.CanConvertToShardsManually]: {
    name: "Disassembler",
    descriptionsByLevel: ["Allows converting items to shards without the use of machines"],
  },
  [CombatantTraitType.ExtraConsumablesStorage]: {
    name: "Magical Minibag",
    descriptionsByLevel: ["Provides extra storage for consumables"],
  },
};
