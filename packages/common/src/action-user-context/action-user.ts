import { AdventuringParty } from "../adventuring-party/index.js";
import {
  CombatantProperties,
  ConditionAppliedBy,
  ConditionTickProperties,
} from "../combatants/index.js";
import {
  CombatantActionState,
  CombatantAttributeRecord,
  CombatantEquipment,
  Inventory,
} from "../combatants/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { EntityId, EntityProperties, MaxAndCurrent } from "../primatives/index.js";
import { ActionUserTargetingProperties } from "./action-user-targeting-properties.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { ActionEntityProperties } from "../action-entities/index.js";
import { Battle } from "../battle/index.js";

export interface IActionUser {
  payResourceCosts(): void; // @REFACTOR - remove if unused
  handleTurnEnded(): void; // @REFACTOR - remove if unused

  // GETTERS
  getEntityId(): EntityId;
  getName(): string;
  getEntityProperties(): EntityProperties;
  getLevel(): number;
  getTotalAttributes(): CombatantAttributeRecord;
  getOwnedAbilities(): Partial<Record<CombatActionName, CombatantActionState>>;
  getEquipmentOption: () => null | CombatantEquipment;
  getInventoryOption(): null | Inventory;
  getTargetingProperties(): ActionUserTargetingProperties;
  getAllyAndOpponentIds(
    party: AdventuringParty,
    battleOption: null | Battle
  ): Record<FriendOrFoe, EntityId[]>;

  // ex: a condition should give threat caused by it's burning ticks to the caster of the spell that caused the condition
  getIdOfEntityToCreditWithThreat(): EntityId;

  // COMBATANTS
  getCombatantProperties(): CombatantProperties;

  // CONDITIONS
  getConditionAppliedBy(): ConditionAppliedBy;
  getConditionAppliedTo(): EntityId;
  getConditionStacks(): MaxAndCurrent;
  getConditionTickPropertiesOption(): null | ConditionTickProperties;

  // POSITION HAVERS
  getPosition(): Vector3;
  getHomePosition(): Vector3;
  getHomeRotation(): Quaternion;

  // ACTION ENTITIES
  getActionEntityProperties(): ActionEntityProperties;
  setWasRemovedBeforeHitOutcomes(): void;
  wasRemovedBeforeHitOutcomes(): boolean;
}
