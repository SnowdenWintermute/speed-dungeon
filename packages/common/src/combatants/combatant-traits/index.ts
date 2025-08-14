import { Percentage } from "../../primatives/index.js";

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

export const BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL: Percentage = 50;
export const EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL = 20;

export interface CombatantTraitDescription {
  name: string;
  descriptionsByLevel: string[];
  maxLevel: number;
}

export const COMBATANT_TRAIT_DESCRIPTIONS: Record<CombatantTraitType, CombatantTraitDescription> = {
  [CombatantTraitType.HpBioavailability]: {
    name: "HP Bioavailability",
    descriptionsByLevel: ["Effectiveness of MP Autoinjectors"],
    maxLevel: 1,
  },
  [CombatantTraitType.MpBioavailability]: {
    name: "MP Bioavailability",
    descriptionsByLevel: ["Effectiveness of MP Autoinjectors"],
    maxLevel: 1,
  },
  [CombatantTraitType.Undead]: {
    name: "Undead",
    descriptionsByLevel: ["Healing magic damages this target"],
    maxLevel: 1,
  },
  [CombatantTraitType.ExtraHotswapSlot]: {
    name: "Stay Strapped",
    descriptionsByLevel: [
      "Adds an additional weapon swap slot - 'You know I keep that thang on me'",
    ],
    maxLevel: 1,
  },
  [CombatantTraitType.CanConvertToShardsManually]: {
    name: "Disassembler",
    descriptionsByLevel: ["Allows converting items to shards without the use of machines"],
    maxLevel: 1,
  },
  [CombatantTraitType.ExtraConsumablesStorage]: {
    name: "Magical Minibag",
    descriptionsByLevel: ["Provides extra storage for consumables"],
    maxLevel: 1,
  },
};
