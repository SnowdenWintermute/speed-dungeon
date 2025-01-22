import { CombatActionComponent, CombatActionName } from "../index.js";
import { ATTACK } from "./attack.js";

export const COMBAT_ACTIONS: Partial<Record<CombatActionName, CombatActionComponent>> = {
  [CombatActionName.Attack]: ATTACK,
};
