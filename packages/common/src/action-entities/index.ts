export * from "./cosmetic-effect.js";
export * from "./cosmetic-effect-constructors.js";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { EntityId, EntityProperties, MaxAndCurrent } from "../primatives/index.js";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";
import { TaggedShape3DDimensions } from "../utils/shape-utils.js";
import {
  CombatantActionState,
  CombatantAttributeRecord,
  ConditionAppliedBy,
  ConditionTickProperties,
} from "../combatants/index.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import {
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionResource,
  CombatActionResourceChangeProperties,
  CombatActionTargetType,
  FriendOrFoe,
} from "../combat/index.js";
import { ActionUserType, IActionUser } from "../action-user-context/action-user.js";
import { ActionUserTargetingProperties } from "../action-user-context/action-user-targeting-properties.js";
import { plainToInstance } from "class-transformer";
import { AdventuringParty } from "../adventuring-party/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../app-consts.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";

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

export type ActionEntityProperties = {
  position: Vector3;
  name: ActionEntityName;
  dimensions?: TaggedShape3DDimensions;
  initialCosmeticYPosition?: SceneEntityChildTransformNodeIdentifier;
  parentOption?: SceneEntityChildTransformNodeIdentifier;
  initialRotation?: Vector3;
  initialPointToward?: SceneEntityChildTransformNodeIdentifier;
  initialLockRotationToFace?: SceneEntityChildTransformNodeIdentifierWithDuration;
  actionOriginData?: ActionEntityActionOriginData;
};

export class ActionEntity implements IActionUser {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}
  getType = () => ActionUserType.ActionEntity;
  getMovementSpeedOption(): null | number {
    return ARROW_TIME_TO_MOVE_ONE_METER;
  }
  getActionEntityProperties(): ActionEntityProperties {
    return this.actionEntityProperties;
  }
  setWasRemovedBeforeHitOutcomes() {
    if (this.actionEntityProperties.actionOriginData === undefined)
      this.actionEntityProperties.actionOriginData = { spawnedBy: { id: "", name: "" } };
    this.actionEntityProperties.actionOriginData.wasIncinerated = true;
  }
  wasRemovedBeforeHitOutcomes(): boolean {
    const wasRemoved = !!this.actionEntityProperties.actionOriginData?.wasIncinerated;
    return wasRemoved;
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
  getOwnedAbilities(): Map<CombatActionName, CombatantActionState> {
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
      return { [FriendOrFoe.Hostile]: allCombatantIds, [FriendOrFoe.Friendly]: allCombatantIds };
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

  static getDeserialized(actionEntity: ActionEntity) {
    const deserialized = plainToInstance(ActionEntity, actionEntity);
    const { actionOriginData } = deserialized.actionEntityProperties;
    if (actionOriginData) {
      const { actionLevel, stacks } = actionOriginData;
      if (actionLevel)
        actionOriginData.actionLevel = new MaxAndCurrent(actionLevel.max, actionLevel.current);
      if (stacks) actionOriginData.stacks = new MaxAndCurrent(stacks.max, stacks.current);
    }

    return deserialized;
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
    return new CombatActionExecutionIntent(CombatActionName.FirewallPassTurn, 1, {
      type: CombatActionTargetType.Single,
      targetId: "",
    });
  },
};
