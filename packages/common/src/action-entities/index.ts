import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";
import { TaggedShape3DDimensions } from "../utils/shape-utils.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { ActionUserType, IActionUser } from "../action-user-context/action-user.js";
import {
  ActionAndRank,
  ActionUserTargetingProperties,
} from "../action-user-context/action-user-targeting-properties.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { AdventuringParty } from "../adventuring-party/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../app-consts.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { Battle } from "../battle/index.js";
import { CombatantAttributeRecord } from "../combatants/combatant-attribute-record.js";
import { ConditionAppliedBy } from "../conditions/condition-applied-by.js";
import { ConditionTickProperties } from "../conditions/condition-tick-properties.js";
import { ActionRank, EntityId, EntityName } from "../aliases.js";
import { MaxAndCurrent } from "../primatives/max-and-current.js";
import { CombatActionResource } from "../combat/combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../combat/combat-actions/combat-action-resource-change-properties.js";
import { EntityProperties } from "../primatives/entity-properties.js";
import { CombatantActionState } from "../combatants/owned-actions/combatant-action-state.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { CombatActionExecutionIntent } from "../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionTargetType } from "../combat/targeting/combat-action-targets.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { makeObservable } from "mobx";

export enum ActionEntityName {
  Arrow,
  IceBolt,
  Explosion,
  IceBurst,
  TargetChangedIndicatorArrow,
  Firewall,
}

export const ACTION_ENTITY_STRINGS: Record<ActionEntityName, string> = {
  [ActionEntityName.Arrow]: "Arrow",
  [ActionEntityName.IceBolt]: "Ice Bolt",
  [ActionEntityName.Explosion]: "Explosion",
  [ActionEntityName.IceBurst]: "Ice Burst",
  [ActionEntityName.TargetChangedIndicatorArrow]: "Target Changed Indicator Arrow",
  [ActionEntityName.Firewall]: "Firewall",
};

export interface ActionEntityActionOriginData {
  targetingProperties?: ActionUserTargetingProperties;
  actionLevel?: MaxAndCurrent;
  turnOrderSpeed?: number;
  stacks?: MaxAndCurrent;
  userCombatantAttributes?: CombatantAttributeRecord;
  userElementalAffinities?: Partial<Record<MagicalElement, number>>;
  userKineticAffinities?: Partial<Record<KineticDamageType, number>>;
  resourceChangeProperties?: Partial<
    Record<CombatActionResource, CombatActionResourceChangeProperties>
  >;
  wasIncinerated?: boolean;
  spawnedBy: EntityProperties;
}

export interface ActionEntityProperties {
  position: Vector3;
  name: ActionEntityName;
  dimensions?: TaggedShape3DDimensions;
  initialCosmeticYPosition?: SceneEntityChildTransformNodeIdentifier;
  parentOption?: SceneEntityChildTransformNodeIdentifier;
  initialRotation?: Vector3;
  initialPointToward?: SceneEntityChildTransformNodeIdentifier;
  initialLockRotationToFace?: SceneEntityChildTransformNodeIdentifierWithDuration;
  actionOriginData?: ActionEntityActionOriginData;
}

export class ActionEntity implements IActionUser, Serializable, ReactiveNode {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}

  makeObservable() {
    makeObservable(this);
    const stacks = this.actionEntityProperties.actionOriginData?.stacks;
    if (stacks) {
      stacks.makeObservable();
    }
    const level = this.actionEntityProperties.actionOriginData?.actionLevel;
    if (level) {
      level.makeObservable();
    }
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<ActionEntity>) {
    const result = plainToInstance(ActionEntity, serialized);

    if (result.actionEntityProperties.actionOriginData) {
      if (result.actionEntityProperties.actionOriginData.stacks) {
        result.actionEntityProperties.actionOriginData.stacks = MaxAndCurrent.fromSerialized(
          result.actionEntityProperties.actionOriginData.stacks
        );
      }
    }
    if (result.actionEntityProperties.actionOriginData) {
      if (result.actionEntityProperties.actionOriginData.actionLevel) {
        result.actionEntityProperties.actionOriginData.actionLevel = MaxAndCurrent.fromSerialized(
          result.actionEntityProperties.actionOriginData.actionLevel
        );
      }
    }
    return result;
  }

  getType = () => ActionUserType.ActionEntity;
  getMovementSpeedOption(): null | number {
    return ARROW_TIME_TO_MOVE_ONE_METER;
  }
  getActionEntityProperties(): ActionEntityProperties {
    return this.actionEntityProperties;
  }
  setWasRemovedBeforeHitOutcomes() {
    if (this.actionEntityProperties.actionOriginData === undefined)
      this.actionEntityProperties.actionOriginData = {
        spawnedBy: { id: "", name: "" as EntityName },
      };
    this.actionEntityProperties.actionOriginData.wasIncinerated = true;
  }
  wasRemovedBeforeHitOutcomes(): boolean {
    const wasRemoved = !!this.actionEntityProperties.actionOriginData?.wasIncinerated;
    return wasRemoved;
  }

  /** Should be displayed in persistent action entity display list on client */
  shouldBeDisplayedInPersistentEntityList() {
    return [ActionEntityName.Firewall].includes(this.actionEntityProperties.name);
  }

  payResourceCosts(): void {
    throw new Error("Method not implemented.");
  }
  handleTurnEnded(): void {}
  getEntityId(): EntityId {
    return this.entityProperties.id;
  }
  getName(): string {
    return this.entityProperties.name;
  }
  getEntityProperties(): EntityProperties {
    return this.entityProperties;
  }
  getLevel(): number {
    return this.actionEntityProperties.actionOriginData?.actionLevel?.current || 1;
  }
  getTotalAttributes(): CombatantAttributeRecord {
    return this.actionEntityProperties.actionOriginData?.userCombatantAttributes || {};
  }
  getOwnedActions(): Map<CombatActionName, CombatantActionState> {
    throw new Error("Method not implemented.");
  }
  getEquipmentOption = () => null;
  getInventoryOption = () => null;

  getTargetingProperties(): ActionUserTargetingProperties {
    const targetingPropertiesOption =
      this.actionEntityProperties.actionOriginData?.targetingProperties;
    if (targetingPropertiesOption !== undefined) return targetingPropertiesOption;
    else throw new Error("no targeting properties exist on this action entity");
  }
  getAllyAndOpponentIds(party: AdventuringParty): Record<FriendOrFoe, EntityId[]> {
    const spawnedBy = this.actionEntityProperties.actionOriginData?.spawnedBy;
    const { combatantManager } = party;

    if (spawnedBy !== undefined) {
      const idsByDisposition = combatantManager.getCombatantIdsByDisposition(spawnedBy.id);
      return idsByDisposition;
    } else {
      const allCombatantIds = combatantManager.getAllCombatantIds();
      return {
        [FriendOrFoe.Hostile]: allCombatantIds,
        [FriendOrFoe.Friendly]: allCombatantIds,
        [FriendOrFoe.Neutral]: allCombatantIds,
      };
    }
  }
  getCombatantProperties(): CombatantProperties {
    throw new Error("invalid on ActionEntity.");
  }
  getConditionAppliedBy(): ConditionAppliedBy {
    throw new Error("invalid on ActionEntity.");
  }
  getConditionAppliedTo(): EntityId {
    throw new Error("invalid on ActionEntity.");
  }
  getConditionStacks(): MaxAndCurrent {
    throw new Error("invalid on ActionEntity.");
  }
  getConditionTickPropertiesOption(): null | ConditionTickProperties {
    throw new Error("invalid on ActionEntity.");
  }
  getPositionOption(): Vector3 {
    return this.actionEntityProperties.position;
  }
  getHomePosition(): Vector3 {
    throw new Error("Method not implemented.");
  }
  getHomeRotation(): Quaternion {
    throw new Error("Method not implemented.");
  }
  getIdOfEntityToCreditWithThreat(): EntityId {
    const spawnedByOption = this.actionEntityProperties.actionOriginData?.spawnedBy;
    if (spawnedByOption === undefined)
      throw new Error("No entity to credit threat could be found for this action entity");
    return spawnedByOption.id;
  }

  hasRequiredAttributesToUseItem(): boolean {
    return true;
  }
  hasRequiredConsumablesToUseAction(): boolean {
    return true;
  }

  getWeaponsInSlots() {
    return {};
  }

  getNaturalUnarmedWeapons() {
    return {};
  }

  targetFlyingConditionPreventsReachingMeleeRange() {
    return false;
  }

  movementIsRestrained = () => false;

  actionAndRankMeetsUseRequirements(
    actionAndRank: ActionAndRank,
    party: AdventuringParty,
    battleOption: Battle | null
  ): { canUse: boolean; reasonCanNot?: string } {
    throw new Error("not implemented on action entities");
  }

  static setStacks(actionEnity: ActionEntity, value: number) {
    const { actionOriginData } = actionEnity.actionEntityProperties;
    if (!actionOriginData) throw new Error("expected actionOriginData on action entity");
    if (actionOriginData.stacks === undefined) throw new Error("expected action entity stacks");
    actionOriginData.stacks.setCurrent(value);
  }
  static setLevel(actionEnity: ActionEntity, value: number) {
    const { actionOriginData } = actionEnity.actionEntityProperties;
    if (!actionOriginData) throw new Error("expected actionOriginData on action entity");
    if (actionOriginData.actionLevel === undefined) throw new Error("expected action entity level");
    actionOriginData.actionLevel.setCurrent(value);
  }
}

// @REFACTOR - it is strange to get the action entity intents like this
// more natural to find it on their class in a getActionIntent method

export const ACTION_ENTITY_ACTION_INTENT_GETTERS: Partial<
  Record<ActionEntityName, () => CombatActionExecutionIntent>
> = {
  [ActionEntityName.Firewall]: () => {
    return new CombatActionExecutionIntent(CombatActionName.FirewallPassTurn, 1 as ActionRank, {
      type: CombatActionTargetType.Single,
      targetId: "",
    });
  },
};
