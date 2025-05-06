export * from "./cosmetic-effect.js";
export * from "./cosmetic-effect-constructors.js";
import { Vector3 } from "@babylonjs/core";
import { EntityId, EntityProperties } from "../primatives/index.js";

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

export enum AbstractParentType {
  UserMainHand,
  UserOffHand,
  VfxEntityRoot,
  CombatantHitboxCenter,
  // OffHand,
  // MainHandWeapon,
  // OffHandWeapon
}

export interface AbstractParent {
  type: AbstractParentType;
  parentEntityId: EntityId;
  offset?: Vector3;
}

export type ActionEntityProperties = {
  position: Vector3;
  name: ActionEntityName;
  // pointTowardEntityOption?: EntityId;
  parentOption?: AbstractParent;
};

export class ActionEntity {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}
}
