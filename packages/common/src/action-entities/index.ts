export * from "./cosmetic-effect.js";
export * from "./cosmetic-effect-constructors.js";
import { Vector3 } from "@babylonjs/core";
import { EntityProperties, MaxAndCurrent } from "../primatives/index.js";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";
import { TaggedShape3DDimensions } from "../utils/shape-utils.js";
import { CombatantAttributeRecord } from "../combatants/index.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import {
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  ResourceChangeSource,
} from "../combat/index.js";

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

export class ActionEntity {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}

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
    return new CombatActionExecutionIntent(
      CombatActionName.FirewallPassTurn,
      { type: CombatActionTargetType.Single, targetId: "" },
      1
    );
  },
};
