import { CombatantTraitType } from "../combatant-traits/index.js";
import { CombatantClass } from "./classes.js";

export const STARTING_COMBATANT_TRAITS: Record<
  CombatantClass,
  Partial<Record<CombatantTraitType, number>>
> = {
  [CombatantClass.Warrior]: {
    [CombatantTraitType.HpBioavailability]: 2,
    [CombatantTraitType.ExtraHotswapSlot]: 1,
  },
  [CombatantClass.Mage]: {
    [CombatantTraitType.MpBioavailability]: 2,
    [CombatantTraitType.ExtraConsumablesStorage]: 1,
  },
  [CombatantClass.Rogue]: {
    [CombatantTraitType.HpBioavailability]: 1,
    [CombatantTraitType.MpBioavailability]: 1,
    [CombatantTraitType.CanConvertToShardsManually]: 1,
  },
};
