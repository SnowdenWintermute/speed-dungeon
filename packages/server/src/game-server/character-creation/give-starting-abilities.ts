import {
  COMBAT_ACTIONS,
  CombatActionName,
  CombatantActionState,
  CombatantProperties,
  MaxAndCurrent,
} from "@speed-dungeon/common";

export function giveStartingAbilities(combatantProperties: CombatantProperties) {
  const ownedActions = [
    // BASICS
    CombatActionName.Attack,
    CombatActionName.UseGreenAutoinjector,
    CombatActionName.UseBlueAutoinjector,
    CombatActionName.PassTurn,
    CombatActionName.ReadSkillBook,
    // CombatActionName.ChainingSplitArrowParent,
    // CombatActionName.Counterattack,
    CombatActionName.IceBoltParent,
    CombatActionName.Fire,
    CombatActionName.Healing,
    CombatActionName.ExplodingArrowParent,
    CombatActionName.Blind,
  ];

  const levelTwoSpells: CombatActionName[] = [
    CombatActionName.IceBoltParent,
    CombatActionName.Fire,
    CombatActionName.Healing,
    CombatActionName.ExplodingArrowParent,
    CombatActionName.Blind,
  ];

  for (const actionName of ownedActions) {
    const action = new CombatantActionState(actionName);
    if (levelTwoSpells.includes(actionName)) action.level = 2;
    const cooldownOption = COMBAT_ACTIONS[actionName].costProperties.getCooldownTurns(
      combatantProperties,
      action.level
    );
    if (cooldownOption) action.cooldown = new MaxAndCurrent(cooldownOption, 0);

    combatantProperties.abilityProperties.ownedActions[actionName] = action;
  }
}
