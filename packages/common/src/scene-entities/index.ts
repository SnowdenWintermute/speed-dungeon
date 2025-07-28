import { HoldableSlotType } from "../items/equipment";
import { Axis, EntityId, Milliseconds } from "../primatives";

export enum SceneEntityType {
  CharacterModel,
  ActionEntityModel,
  CharacterEquipmentModel,
}

export interface CharacterModelIdentifier {
  type: SceneEntityType.CharacterModel;
  entityId: EntityId;
}

export interface CharacterEquipmentModelIdentifier {
  type: SceneEntityType.CharacterEquipmentModel;
  characterModelId: EntityId;
  slot: HoldableSlotType;
}

export interface ActionEntityModelIdentifier {
  type: SceneEntityType.ActionEntityModel;
  entityId: EntityId;
}

export type SceneEntityIdentifier =
  | CharacterModelIdentifier
  | CharacterEquipmentModelIdentifier
  | ActionEntityModelIdentifier;

export type CombatantBaseChildTransformNodeIdentifier = {
  sceneEntityIdentifier: CharacterModelIdentifier;
  transformNodeName: CombatantBaseChildTransformNodeName;
  ignoreAxes?: Axis[];
};

export type ActionEntityBaseChildTransformNodeIdentifier = {
  sceneEntityIdentifier: ActionEntityModelIdentifier;
  transformNodeName: ActionEntityBaseChildTransformNodeName;
  ignoreAxes?: Axis[];
};

export type CombatantHoldableChildTransformNodeIdentifier = {
  sceneEntityIdentifier: CharacterEquipmentModelIdentifier;
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
  Head,
}

export const COMBATANT_BASE_TRANSFORM_NODE_NAME_STRINGS: Record<
  CombatantBaseChildTransformNodeName,
  string
> = {
  [CombatantBaseChildTransformNodeName.MainHandEquipment]: "MainHandEquipment",
  [CombatantBaseChildTransformNodeName.OffhandEquipment]: "OffhandEquipment",
  [CombatantBaseChildTransformNodeName.EntityRoot]: "EntityRoot",
  [CombatantBaseChildTransformNodeName.HitboxCenter]: "HitboxCenter",
  [CombatantBaseChildTransformNodeName.Head]: "HitboxCenter",
};

export enum ActionEntityBaseChildTransformNodeName {
  EntityRoot,
}

export enum CombatantHoldableChildTransformNodeName {
  NockBone,
  ArrowRest,
}
