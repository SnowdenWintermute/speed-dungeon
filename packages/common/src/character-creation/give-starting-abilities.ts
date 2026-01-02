import { IActionUser } from "../action-user-context/action-user.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatantActionState } from "../combatants/owned-actions/combatant-action-state.js";
import { MaxAndCurrent } from "../primatives/max-and-current.js";

export function giveStartingAbilities(actionUser: IActionUser) {
  const ownedActions = [
    // BASICS
    CombatActionName.Attack,
    CombatActionName.UseGreenAutoinjector,
    CombatActionName.UseBlueAutoinjector,
    CombatActionName.PassTurn,
    CombatActionName.ReadSkillBook,
    CombatActionName.ChainingSplitArrowParent,
    // CombatActionName.TamePet,
    // CombatActionName.SummonPetParent,
    // CombatActionName.DismissPet,
    // CombatActionName.ReleasePet,
    // CombatActionName.PetCommand,
    CombatActionName.IceBoltParent,
    CombatActionName.Ensnare,
    CombatActionName.Fire,
    CombatActionName.Healing,
    CombatActionName.ExplodingArrowParent,
    // CombatActionName.Blind,
    CombatActionName.Firewall,
  ];

  const levelTwoSpells: CombatActionName[] = [
    // CombatActionName.IceBoltParent,
    CombatActionName.Fire,
    CombatActionName.Firewall,
    CombatActionName.Healing,
    // CombatActionName.SummonPetParent,
    // CombatActionName.TamePet,
    // CombatActionName.PetCommand,
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
