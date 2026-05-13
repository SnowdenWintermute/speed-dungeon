import cloneDeep from "lodash.clonedeep";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatantClass } from "./classes.js";

export function getPlayerCharacterStartingActions(combatantClass: CombatantClass) {
  const actionsForClass = cloneDeep(CHARACTER_STARTING_OWNED_ACTIONS[combatantClass]);
  for (const actionName of genericActions) {
    actionsForClass[actionName] = 1;
  }

  return actionsForClass;
}

const genericActions = [
  CombatActionName.Attack,
  CombatActionName.ReadSkillBook,
  CombatActionName.UseGreenAutoinjector,
  CombatActionName.UseBlueAutoinjector,
  CombatActionName.PassTurn,
];

const CHARACTER_STARTING_OWNED_ACTIONS: Record<
  CombatantClass,
  Partial<Record<CombatActionName, number>>
> = {
  [CombatantClass.Warrior]: {
    [CombatActionName.ChainingSplitArrowParent]: 1,
    [CombatActionName.IceBoltParent]: 1,
    [CombatActionName.Ensnare]: 1,
    [CombatActionName.ExplodingArrowParent]: 1,
    [CombatActionName.Fire]: 3,
    [CombatActionName.Healing]: 3,
    [CombatActionName.Firewall]: 3,
  },
  [CombatantClass.Mage]: {
    [CombatActionName.ChainingSplitArrowParent]: 1,
    [CombatActionName.IceBoltParent]: 1,
    [CombatActionName.Ensnare]: 1,
    [CombatActionName.ExplodingArrowParent]: 1,
    [CombatActionName.Fire]: 3,
    [CombatActionName.Healing]: 3,
    [CombatActionName.Firewall]: 3,
  },
  [CombatantClass.Rogue]: {
    [CombatActionName.ChainingSplitArrowParent]: 1,
    [CombatActionName.IceBoltParent]: 1,
    [CombatActionName.Ensnare]: 1,
    [CombatActionName.ExplodingArrowParent]: 1,
    [CombatActionName.Fire]: 3,
    [CombatActionName.Healing]: 3,
    [CombatActionName.Firewall]: 3,
  },
};
