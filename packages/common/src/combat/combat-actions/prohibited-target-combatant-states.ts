import { CombatActionProperties } from "..";
import { Combatant } from "../../combatants";

export enum ProhibitedTargetCombatantStates {
  Dead,
  Alive,
  UntargetableBySpells,
  UntargetableByPhysical,
}

export const PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS: Record<
  ProhibitedTargetCombatantStates,
  (actionProperties: CombatActionProperties, combatant: Combatant) => boolean
> = {
  [ProhibitedTargetCombatantStates.Dead]: function (
    _actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return combatant.combatantProperties.hitPoints <= 0;
  },
  [ProhibitedTargetCombatantStates.Alive]: function (
    _actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return combatant.combatantProperties.hitPoints > 0;
  },
  [ProhibitedTargetCombatantStates.UntargetableByMagic]: function (
    actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return false;
  },
  [ProhibitedTargetCombatantStates.UntargetableByPhysical]: function (
    actionProperties: CombatActionProperties,
    combatant: Combatant
  ): boolean {
    return false;
  },
};
