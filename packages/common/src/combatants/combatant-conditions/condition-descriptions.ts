import { CombatantConditionName } from "./condition-names.js";

export const COMBATANT_CONDITION_DESCRIPTIONS: Record<CombatantConditionName, string> = {
  [CombatantConditionName.PrimedForExplosion]: "Causes an explosion when hit by certain actions",
  [CombatantConditionName.PrimedForIceBurst]: "Causes an ice burst when hit by certain actions",
  [CombatantConditionName.Burning]: "Periodically takes non-magical fire damage",
  [CombatantConditionName.Blinded]: "Accuracy is reduced",
  [CombatantConditionName.FollowingPetCommand]: "Making decisions based on external factors",
  [CombatantConditionName.Flying]: "Untargetable by melee actions",
};
