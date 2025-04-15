import { CombatActionComponent } from ".";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";

export enum ProhibitedTargetCombatantStates {
  FullHp,
  Dead,
  Alive,
  UntargetableBySpells,
  UntargetableByPhysical,
}

export const PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS: Record<
  ProhibitedTargetCombatantStates,
  (action: CombatActionComponent, combatant: Combatant) => boolean
> = {
  [ProhibitedTargetCombatantStates.FullHp]: function (
    action: CombatActionComponent,
    combatant: Combatant
  ): boolean {
    const maxHp = CombatantProperties.getTotalAttributes(combatant.combatantProperties)[
      CombatAttribute.Hp
    ];
    return combatant.combatantProperties.hitPoints >= maxHp;
  },
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
