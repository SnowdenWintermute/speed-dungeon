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
  (combatant: Combatant) => boolean
> = {
  [ProhibitedTargetCombatantStates.FullHp]: function (combatant: Combatant): boolean {
    const maxHp = CombatantProperties.getTotalAttributes(combatant.combatantProperties)[
      CombatAttribute.Hp
    ];
    return combatant.combatantProperties.hitPoints >= maxHp;
  },
  [ProhibitedTargetCombatantStates.Dead]: function (combatant: Combatant): boolean {
    return combatant.combatantProperties.hitPoints <= 0;
  },
  [ProhibitedTargetCombatantStates.Alive]: function (combatant: Combatant): boolean {
    return combatant.combatantProperties.hitPoints > 0;
  },
  [ProhibitedTargetCombatantStates.UntargetableBySpells]: function (combatant: Combatant): boolean {
    return false;
  },
  [ProhibitedTargetCombatantStates.UntargetableByPhysical]: function (
    combatant: Combatant
  ): boolean {
    return false;
  },
};
