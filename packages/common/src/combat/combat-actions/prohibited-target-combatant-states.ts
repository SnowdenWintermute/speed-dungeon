import { Combatant } from "../../combatants/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { CombatantTraitType } from "../../combatants/combatant-traits/trait-types.js";
import { IActionUser } from "../../action-user-context/action-user.js";

export enum ProhibitedTargetCombatantStates {
  FullHp,
  FullMana,
  Dead,
  Alive,
  UntargetableBySpells,
  UntargetableByPhysical,
  IsNotTameable,
  IsBeyondUserMaximumPetLevel,
  IsNotThisUsersPet,
  TargetFlyingPreventsReachingRequiredRange,
  CanNotBeTargetedByRestraintActions,
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
  [ProhibitedTargetCombatantStates.IsNotTameable]: "IsNotTameable",
  [ProhibitedTargetCombatantStates.IsBeyondUserMaximumPetLevel]: "IsBeyondUserMaximumPetLevel",
  [ProhibitedTargetCombatantStates.IsNotThisUsersPet]: "IsNotThisUsersPet",
  [ProhibitedTargetCombatantStates.TargetFlyingPreventsReachingRequiredRange]:
    "TargetFlyingPreventsReachingRequiredRange",
  [ProhibitedTargetCombatantStates.CanNotBeTargetedByRestraintActions]:
    "CanNotBeTargetedByRestraintActions",
};

export const PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS: Record<
  ProhibitedTargetCombatantStates,
  (combatant: Combatant, user: IActionUser) => boolean
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
  [ProhibitedTargetCombatantStates.IsNotTameable]: function (combatant: Combatant): boolean {
    const isTameable = combatant.combatantProperties.abilityProperties
      .getTraitProperties()
      .hasTraitType(CombatantTraitType.IsTameable);
    return !isTameable;
  },
  [ProhibitedTargetCombatantStates.IsBeyondUserMaximumPetLevel]: function (
    combatant: Combatant,
    user: IActionUser
  ): boolean {
    const userMaxPetLevel = user.getCombatantProperties().abilityProperties.getMaxPetLevel();
    const targetLevel = combatant.getLevel();
    return targetLevel > userMaxPetLevel;
  },
  [ProhibitedTargetCombatantStates.IsNotThisUsersPet]: function (
    combatant: Combatant,
    user: IActionUser
  ): boolean {
    return combatant.combatantProperties.controlledBy.summonedBy !== user.getEntityId();
  },
  [ProhibitedTargetCombatantStates.TargetFlyingPreventsReachingRequiredRange]: (target, user) => {
    const canNotReachTarget = user.targetFlyingConditionPreventsReachingMeleeRange(
      target.combatantProperties
    );
    return !canNotReachTarget;
  },
  [ProhibitedTargetCombatantStates.CanNotBeTargetedByRestraintActions]: (target, user) => {
    const isUnrestrainable = target.combatantProperties.abilityProperties
      .getTraitProperties()
      .hasTraitType(CombatantTraitType.CanNotBeRestrained);
    return isUnrestrainable;
  },
};
