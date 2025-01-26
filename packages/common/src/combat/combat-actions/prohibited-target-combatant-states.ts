import { CombatActionComponent } from ".";
import { Combatant } from "../../combatants";

export enum ProhibitedTargetCombatantStates {
  Dead,
  Alive,
  UntargetableBySpells,
  UntargetableByPhysical,
}

export const PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS: Record<
  ProhibitedTargetCombatantStates,
  (action: CombatActionComponent, combatant: Combatant) => boolean
> = {
  [ProhibitedTargetCombatantStates.Dead]: function (
    _action: CombatActionComponent,
    combatant: Combatant
  ): boolean {
    return combatant.combatantProperties.hitPoints <= 0;
  },
  [ProhibitedTargetCombatantStates.Alive]: function (
    _action: CombatActionComponent,
    combatant: Combatant
  ): boolean {
    return combatant.combatantProperties.hitPoints > 0;
  },
  [ProhibitedTargetCombatantStates.UntargetableBySpells]: function (
    action: CombatActionComponent,
    combatant: Combatant
  ): boolean {
    return false;
  },
  [ProhibitedTargetCombatantStates.UntargetableByPhysical]: function (
    actions: CombatActionComponent,
    combatant: Combatant
  ): boolean {
    return false;
  },
};
