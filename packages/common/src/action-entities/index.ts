export * from "./cosmetic-effect.js";
export * from "./cosmetic-effect-constructors.js";
import { Vector3 } from "@babylonjs/core";
import { Axis, EntityId, EntityProperties, Milliseconds } from "../primatives/index.js";
import { HoldableSlotType } from "../items/equipment/slots.js";

export enum ActionEntityName {
  Arrow,
  IceBolt,
  Explosion,
  IceBurst,
}

export const ACTION_ENTITY_STRINGS: Record<ActionEntityName, string> = {
  [ActionEntityName.Arrow]: "Arrow",
  [ActionEntityName.IceBolt]: "Ice Bolt",
  [ActionEntityName.Explosion]: "Explosion",
  [ActionEntityName.IceBurst]: "IceBurst",
};

export enum SceneEntityChildTransformNodeType {
  ActionEntityBase,
  CombatantBase,
  CombatantEquippedHoldable,
}

export type CombatantBaseChildTransformNodeIdentifier = {
  type: SceneEntityChildTransformNodeType.CombatantBase;
  entityId: EntityId;
  transformNodeName: CombatantBaseChildTransformNodeName;
  ignoreAxes?: Axis[];
};

export type ActionEntityBaseChildTransformNodeIdentifier = {
  type: SceneEntityChildTransformNodeType.ActionEntityBase;
  entityId: EntityId;
  transformNodeName: ActionEntityBaseChildTransformNodeName;
  ignoreAxes?: Axis[];
};

export type CombatantHoldableChildTransformNodeIdentifier = {
  type: SceneEntityChildTransformNodeType.CombatantEquippedHoldable;
  entityId: EntityId;
  holdableSlot: HoldableSlotType;
  transformNodeName: CombatantHoldableChildTransformNodeName;
  ignoreAxes?: Axis[];
};

export type SceneEntityChildTransformNodeIdentifier =
  | CombatantBaseChildTransformNodeIdentifier
  | ActionEntityBaseChildTransformNodeIdentifier
  | CombatantHoldableChildTransformNodeIdentifier;

export interface SceneEntityChildTransformNodeIdentifierWithDuration {
  identifier: SceneEntityChildTransformNodeIdentifier;
  duration: Milliseconds;
}

export enum CombatantBaseChildTransformNodeName {
  MainHandEquipment,
  OffhandEquipment,
  EntityRoot,
  HitboxCenter,
}

export enum ActionEntityBaseChildTransformNodeName {
  EntityRoot,
}

export enum CombatantHoldableChildTransformNodeName {
  NockBone,
  ArrowRest,
}

export type ActionEntityProperties = {
  position: Vector3;
  name: ActionEntityName;
  parentOption?: SceneEntityChildTransformNodeIdentifier;
  initialRotation?: Vector3;
};

export class ActionEntity {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}
}
