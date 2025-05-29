export * from "./cosmetic-effect.js";
export * from "./cosmetic-effect-constructors.js";
import { Vector3 } from "@babylonjs/core";
import { EntityProperties } from "../primatives/index.js";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";

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

export type ActionEntityProperties = {
  position: Vector3;
  name: ActionEntityName;
  initialCosmeticYPosition?: SceneEntityChildTransformNodeIdentifier;
  parentOption?: SceneEntityChildTransformNodeIdentifier;
  initialRotation?: Vector3;
  initialPointToward?: SceneEntityChildTransformNodeIdentifier;
  initialLockRotationToFace?: SceneEntityChildTransformNodeIdentifierWithDuration;
};

export class ActionEntity {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}
}
