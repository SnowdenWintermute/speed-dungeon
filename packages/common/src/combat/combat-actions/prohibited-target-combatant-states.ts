import { Combatant } from "../../combatants/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";

export enum ProhibitedTargetCombatantStates {
  FullHp,
  FullMana,
  Dead,
  Alive,
  UntargetableBySpells,
  UntargetableByPhysical,
}

export const PROHIBITED_TARGET_COMBATANT_STATE_STRINGS: Record<
  ProhibitedTargetCombatantStates,
  string
> = {
  [ProhibitedTargetCombatantStates.FullHp]: "FullHp",
  [ProhibitedTargetCombatantStates.FullMana]: "FullMana",
  [ProhibitedTargetCombatantStates.Dead]: "Dead",
  [ProhibitedTargetCombatantStates.Alive]: "Alive",
  [ProhibitedTargetCombatantStates.UntargetableBySpells]: "UntargetableBySpells",
  [ProhibitedTargetCombatantStates.UntargetableByPhysical]: "UntargetableByPhysical",
};

export const PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS: Record<
  ProhibitedTargetCombatantStates,
  (combatant: Combatant) => boolean
> = {
  [ProhibitedTargetCombatantStates.FullHp]: function (combatant: Combatant): boolean {
    const maxHp = combatant.combatantProperties.attributeProperties.getAttributeValue(
      CombatAttribute.Hp
    );
    return combatant.combatantProperties.resources.getHitPoints() >= maxHp;
  },
  [ProhibitedTargetCombatantStates.FullMana]: function (combatant: Combatant): boolean {
    const maxMp = combatant.combatantProperties.attributeProperties.getAttributeValue(
      CombatAttribute.Mp
    );
    return combatant.combatantProperties.resources.getMana() >= maxMp;
  },
  [ProhibitedTargetCombatantStates.Dead]: function (combatant: Combatant): boolean {
    return combatant.combatantProperties.isDead();
  },
  [ProhibitedTargetCombatantStates.Alive]: function (combatant: Combatant): boolean {
    return !combatant.combatantProperties.isDead();
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
