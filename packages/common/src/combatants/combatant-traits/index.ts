import { Percentage } from "../../primatives/index.js";
import { ArrayUtils } from "../../utils/array-utils.js";
import { AbilityTreeAbility } from "../../abilities/index.js";
import { CombatantTraitType } from "./trait-types.js";

export * from "./combatant-trait-properties.js";

export const BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL: Percentage = 50;
export const EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL = 20;

export class CombatantTraitDescription {
  public readonly descriptionsByLevel: string[];
  public readonly name: string;
  public readonly maxLevel: number;
  public readonly isAllocatable: boolean;
  public readonly summary: string;
  public readonly flavorText?: string;
  public readonly prerequisiteAbilities?: AbilityTreeAbility[];
  constructor(config: {
    name: string;
    maxLevel: number;
    isAllocatable: boolean;
    summary: string;
    createDescriptionsByLevel: (traitDescription: CombatantTraitDescription) => string[];
    flavorText?: string;
    prerequisiteAbilities?: AbilityTreeAbility[];
  }) {
    this.name = config.name;
    this.summary = config.summary;
    this.maxLevel = config.maxLevel;
    this.isAllocatable = config.isAllocatable;
    this.flavorText = config.flavorText;
    this.prerequisiteAbilities = config.prerequisiteAbilities;

    this.descriptionsByLevel = config.createDescriptionsByLevel(this);
  }
}

export const COMBATANT_TRAIT_DESCRIPTIONS: Record<CombatantTraitType, CombatantTraitDescription> = {
  [CombatantTraitType.HpBioavailability]: new CombatantTraitDescription({
    name: "HP Bioavailability",
    maxLevel: 2,
    isAllocatable: false,
    summary: "Increases effectiveness of green autoinjectors",
    createDescriptionsByLevel: (self) => {
      const toReturn = ArrayUtils.createFilledWithSequentialNumbers(self.maxLevel, 1).map(
        (level) =>
          `Effectiveness increased by ${BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL * level}%`
      );
      return toReturn;
    },
  }),
  [CombatantTraitType.MpBioavailability]: new CombatantTraitDescription({
    name: "MP Bioavailability",
    maxLevel: 2,
    isAllocatable: false,
    summary: "Increases effectiveness of blue autoinjectors",
    createDescriptionsByLevel: (self) => {
      const toReturn = ArrayUtils.createFilledWithSequentialNumbers(self.maxLevel, 1).map(
        (level) =>
          `Effectiveness increased by ${BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL * level}%`
      );
      return toReturn;
    },
  }),
  [CombatantTraitType.Undead]: new CombatantTraitDescription({
    name: "Undead",
    maxLevel: 1,
    isAllocatable: false,
    summary: "Takes damage from healing magic",
    createDescriptionsByLevel: (self) => [],
  }),
  [CombatantTraitType.ExtraHotswapSlot]: new CombatantTraitDescription({
    name: "Stay Strapped",
    maxLevel: 1,
    isAllocatable: false,
    summary: "Adds an additional weapon swap slot",
    createDescriptionsByLevel: (self) => [],
  }),
  [CombatantTraitType.CanConvertToShardsManually]: new CombatantTraitDescription({
    name: "Disassembler",
    maxLevel: 1,
    isAllocatable: false,
    summary: "Allows converting items to shards without the use of machines",
    createDescriptionsByLevel: (self) => [],
  }),
  [CombatantTraitType.ExtraConsumablesStorage]: new CombatantTraitDescription({
    name: "Magical Minibag",
    maxLevel: 1,
    isAllocatable: false,
    summary: "Provides extra storage for consumables",
    createDescriptionsByLevel: (self) => [],
  }),
};
