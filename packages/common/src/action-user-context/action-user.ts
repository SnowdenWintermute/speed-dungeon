import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatantActionState, CombatantEquipment, Inventory } from "../combatants/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { EntityId, EntityProperties, MaxAndCurrent } from "../primatives/index.js";
import {
  ActionAndRank,
  ActionUserTargetingProperties,
} from "./action-user-targeting-properties.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { ActionEntityProperties } from "../action-entities/index.js";
import { Battle } from "../battle/index.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { Item } from "../items/index.js";
import { HoldableSlotType } from "../items/equipment/slots.js";
import { Equipment, WeaponProperties } from "../items/equipment/index.js";
import { CombatantAttributeRecord } from "../combatants/combatant-attribute-record.js";
import { ConditionTickProperties } from "../conditions/condition-tick-properties.js";
import { ConditionAppliedBy } from "../conditions/condition-applied-by.js";

export enum ActionUserType {
  Combatant,
  Condition,
  ActionEntity,
}

export interface IActionUser {
  payResourceCosts(): void; // @REFACTOR - remove if unused
  handleTurnEnded(): void;

  // GETTERS
  getType(): ActionUserType;
  getEntityId(): EntityId;
  getName(): string;
  getEntityProperties(): EntityProperties;
  getLevel(): number;
  getTotalAttributes(): CombatantAttributeRecord;
  getOwnedActions(): Map<CombatActionName, CombatantActionState>;
  getEquipmentOption: () => null | CombatantEquipment;
  getInventoryOption(): null | Inventory;
  getTargetingProperties(): ActionUserTargetingProperties;
  getAllyAndOpponentIds(
    party: AdventuringParty,
    battleOption: null | Battle
  ): Record<FriendOrFoe, EntityId[]>;

  // ex: a condition should give threat caused by it's burning ticks to the caster of the spell that caused the condition
  getIdOfEntityToCreditWithThreat(): EntityId;

  hasRequiredAttributesToUseItem(item: Item): boolean;
  hasRequiredConsumablesToUseAction(actionName: CombatActionName): boolean;

  actionAndRankMeetsUseRequirements(
    actionAndRank: ActionAndRank,
    party: AdventuringParty,
    battleOption: Battle | null
  ): { canUse: boolean; reasonCanNot?: string };

  getWeaponsInSlots(
    weaponSlots: HoldableSlotType[],
    options: { usableWeaponsOnly: boolean }
  ): Partial<
    Record<
      HoldableSlotType,
      {
        equipment: Equipment;
        weaponProperties: WeaponProperties;
      }
    >
  >;

  getNaturalUnarmedWeapons(): Partial<
    Record<
      HoldableSlotType,
      {
        equipment: Equipment;
        weaponProperties: WeaponProperties;
      }
    >
  >;

  targetFlyingConditionPreventsReachingMeleeRange(target: CombatantProperties): boolean;

  // COMBATANTS
  getCombatantProperties(): CombatantProperties;

  // CONDITIONS
  getConditionAppliedBy(): ConditionAppliedBy;
  getConditionAppliedTo(): EntityId;
  getConditionStacks(): MaxAndCurrent;
  getConditionTickPropertiesOption(): null | ConditionTickProperties;

  // POSITION HAVERS
  getPositionOption(): null | Vector3;
  getHomePosition(): Vector3;
  getHomeRotation(): Quaternion;
  movementIsRestrained(): boolean;
  /**milliseconds per meter*/
  getMovementSpeedOption(): null | number;

  // ACTION ENTITIES
  getActionEntityProperties(): ActionEntityProperties;
  setWasRemovedBeforeHitOutcomes(): void;
  wasRemovedBeforeHitOutcomes(): boolean;
}
