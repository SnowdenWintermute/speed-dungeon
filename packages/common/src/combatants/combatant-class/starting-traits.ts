import { CombatantTrait, CombatantTraitType } from "../combatant-traits.js";
import { CombatantClass } from "./classes.js";

export const STARTING_COMBATANT_TRAITS: Record<CombatantClass, CombatantTrait[]> = {
  [CombatantClass.Warrior]: [
    {
      type: CombatantTraitType.HpBioavailability,
      percent: 200,
    },
  ],
  [CombatantClass.Mage]: [
    {
      type: CombatantTraitType.MpBioavailability,
      percent: 200,
    },
  ],
  [CombatantClass.Rogue]: [
    {
      type: CombatantTraitType.HpBioavailability,
      percent: 150,
    },
    {
      type: CombatantTraitType.MpBioavailability,
      percent: 150,
    },
  ],
};
