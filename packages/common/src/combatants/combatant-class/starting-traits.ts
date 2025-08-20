import { CombatantTraitType } from "../combatant-traits/index.js";
import { CombatantClass } from "./classes.js";

export const STARTING_COMBATANT_TRAITS: Record<
  CombatantClass,
  Partial<Record<CombatantTraitType, number>>
> = {
  [CombatantClass.Warrior]: {
    [CombatantTraitType.HpBioavailability]: 2, // percentage effectiveness of consumables
    [CombatantTraitType.ExtraHotswapSlot]: 1, // number of extra slots
  },
  [CombatantClass.Mage]: {
    [CombatantTraitType.MpBioavailability]: 2, // percentage effectiveness of consumables
    [CombatantTraitType.ExtraConsumablesStorage]: 20, // number of consumables
  },
  [CombatantClass.Rogue]: {
    [CombatantTraitType.HpBioavailability]: 1, // percentage effectiveness of consumables
    [CombatantTraitType.MpBioavailability]: 1, // percentage effectiveness of consumables
    [CombatantTraitType.CanConvertToShardsManually]: 1, // true
  },
};
