import {
  COMBAT_ACTIONS,
  CombatActionName,
  CombatantActionState,
  MaxAndCurrent,
} from "@speed-dungeon/common";
import { IActionUser } from "@speed-dungeon/common/src/action-user-context/action-user";

export function giveStartingAbilities(actionUser: IActionUser) {
  const ownedActions = [
    // BASICS
    CombatActionName.Attack,
    CombatActionName.UseGreenAutoinjector,
    CombatActionName.UseBlueAutoinjector,
    CombatActionName.PassTurn,
    CombatActionName.ReadSkillBook,
    CombatActionName.ChainingSplitArrowParent,
    CombatActionName.SummonPet,
    // CombatActionName.Counterattack,
    // CombatActionName.IceBoltParent,
    // CombatActionName.Fire,
    CombatActionName.Healing,
    // CombatActionName.ExplodingArrowParent,
    // CombatActionName.Blind,
    // CombatActionName.Firewall,
  ];

  const levelTwoSpells: CombatActionName[] = [
    // CombatActionName.IceBoltParent,
    // CombatActionName.Fire,
    // CombatActionName.Firewall,
    CombatActionName.Healing,
    // CombatActionName.ExplodingArrowParent,
    // CombatActionName.Blind,
  ];

  for (const actionName of ownedActions) {
    const action = new CombatantActionState(actionName);
    if (levelTwoSpells.includes(actionName)) action.level = 3;
    const cooldownOption = COMBAT_ACTIONS[actionName].costProperties.getCooldownTurns(
      actionUser,
      action.level
    );
    if (cooldownOption) action.cooldown = new MaxAndCurrent(cooldownOption, 0);

    actionUser.getCombatantProperties().abilityProperties.setOwnedAction(action);
  }
}
