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
  CombatantEquipment,
  CombatantProperties,
  ConditionAppliedBy,
  ConditionTickProperties,
  Inventory,
} from "../combatants/index.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import {
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  FriendOrFoe,
  ResourceChangeSource,
} from "../combat/index.js";
import { IActionUser } from "../action-user-context/action-user.js";
import { ActionUserTargetingProperties } from "../action-user-context/action-user-targeting-properties.js";

export enum ActionEntityName {
  Arrow,
  DummyArrow,
  IceBolt,
  Explosion,
  IceBurst,
  TargetChangedIndicatorArrow,
  Firewall,
}

export const ACTION_ENTITY_STRINGS: Record<ActionEntityName, string> = {
  [ActionEntityName.Arrow]: "Arrow",
  [ActionEntityName.DummyArrow]: "Dummy Arrow", // for chaining split arrow, make a separate type so it isn't ignited
  [ActionEntityName.IceBolt]: "Ice Bolt",
  [ActionEntityName.Explosion]: "Explosion",
  [ActionEntityName.IceBurst]: "Ice Burst",
  [ActionEntityName.TargetChangedIndicatorArrow]: "Target Changed Indicator Arrow",
  [ActionEntityName.Firewall]: "Firewall",
};

// for when things pass through firewall, we can know
// what the caster's +bonus to fire damage was when they cast it
export interface ActionEntityActionOriginData {
  actionLevel?: MaxAndCurrent;
  turnOrderSpeed?: number;
  stacks?: MaxAndCurrent;
  userCombatantAttributes?: CombatantAttributeRecord;
  userElementalAffinities?: Partial<Record<MagicalElement, number>>;
  userKineticAffinities?: Partial<Record<KineticDamageType, number>>;
  resourceChangeSource?: ResourceChangeSource;
  wasIncinerated?: boolean;
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
  getActionEntityProperties(): ActionEntityProperties {
    return this.actionEntityProperties;
  }
  setWasRemovedBeforeHitOutcomes() {
    if (this.actionEntityProperties.actionOriginData === undefined)
      this.actionEntityProperties.actionOriginData = {};
    this.actionEntityProperties.actionOriginData.wasIncinerated = true;
  }
  wasRemovedBeforeHitOutcomes(): boolean {
    return !!this.actionEntityProperties.actionOriginData?.wasIncinerated;
  }
  payResourceCosts(): void {
    throw new Error("Method not implemented.");
  }
  handleTurnEnded(): void {
    throw new Error("Method not implemented.");
  }
  getEntityId(): EntityId {
    throw new Error("Method not implemented.");
  }
  getName(): string {
    throw new Error("Method not implemented.");
  }
  getEntityProperties(): EntityProperties {
    throw new Error("Method not implemented.");
  }
  getLevel(): number {
    throw new Error("Method not implemented.");
  }
  getTotalAttributes(): CombatantAttributeRecord {
    throw new Error("Method not implemented.");
  }
  getOwnedAbilities(): Partial<Record<CombatActionName, CombatantActionState>> {
    throw new Error("Method not implemented.");
  }
  getEquipmentOption = () => null;
  getInventoryOption(): null | Inventory {
    throw new Error("Method not implemented.");
  }
  getTargetingProperties(): ActionUserTargetingProperties {
    throw new Error("Method not implemented.");
  }
  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]> {
    throw new Error("Method not implemented.");
  }
  getCombatantProperties(): CombatantProperties {
    throw new Error("Method not implemented.");
  }
  getConditionAppliedBy(): ConditionAppliedBy {
    throw new Error("Method not implemented.");
  }
  getConditionAppliedTo(): EntityId {
    throw new Error("Method not implemented.");
  }
  getConditionStacks(): MaxAndCurrent {
    throw new Error("Method not implemented.");
  }
  getConditionTickPropertiesOption(): null | ConditionTickProperties {
    throw new Error("Method not implemented.");
  }
  getPosition(): Vector3 {
    throw new Error("Method not implemented.");
  }
  getHomePosition(): Vector3 {
    throw new Error("Method not implemented.");
  }
  getHomeRotation(): Quaternion {
    throw new Error("Method not implemented.");
  }
  getIdOfEntityToCreditWithThreat(): EntityId {
    throw new Error("Method not implemented.");
  }

  static hydrate(actionEntity: ActionEntity) {
    const { actionOriginData } = actionEntity.actionEntityProperties;
    if (actionOriginData) {
      const { actionLevel, stacks } = actionOriginData;
      if (actionLevel)
        actionOriginData.actionLevel = new MaxAndCurrent(actionLevel.max, actionLevel.current);
      if (stacks) actionOriginData.stacks = new MaxAndCurrent(stacks.max, stacks.current);
    }
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
