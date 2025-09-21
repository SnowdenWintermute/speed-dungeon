import { ActionEntity } from "../action-entities/index.js";
import {
  Combatant,
  CombatantActionState,
  CombatantAttributeRecord,
  CombatantCondition,
  CombatantEquipment,
  Inventory,
} from "../combatants/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";

export type ActionUserEntity = Combatant | CombatantCondition | ActionEntity;

export interface IActionUser {
  payResourceCosts(): void;
  handleTurnEnded(): void;

  // GETTERS
  getEntity(): ActionUserEntity;
  getLevel(): number;
  getTotalAttributes(): CombatantAttributeRecord;
  getOwnedAbilities(): Partial<Record<CombatActionName, CombatantActionState>>;
  getEquipmentOption: () => null | CombatantEquipment;
  getInventoryOption(): null | Inventory;
}
