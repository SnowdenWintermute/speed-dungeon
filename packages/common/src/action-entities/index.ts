export * from "./client-only-vfx.js";
export * from "./client-only-vfx-constructors.js";
import { Vector3 } from "@babylonjs/core";
import { EntityId, EntityProperties } from "../primatives/index.js";

export enum ActionEntityName {
  Arrow,
  IceBolt,
  Explosion,
  IceBurst,
}

export const MOBILE_VFX_NAME_STRINGS: Record<ActionEntityName, string> = {
  [ActionEntityName.Arrow]: "Arrow",
  [ActionEntityName.IceBolt]: "Ice Bolt",
  [ActionEntityName.Explosion]: "Explosion",
  [ActionEntityName.IceBurst]: "IceBurst",
};

export enum VfxParentType {
  UserMainHand,
  UserOffHand,
  VfxEntityRoot,
  CombatantHitboxCenter,
  // OffHand,
  // MainHandWeapon,
  // OffHandWeapon
}

export interface VfxParent {
  type: VfxParentType;
  parentEntityId: EntityId;
  offset?: Vector3;
}

export type ActionEntityProperties = {
  position: Vector3;
  name: ActionEntityName;
  pointTowardEntityOption?: EntityId;
  parentOption?: VfxParent;
};

export class ActionEntity {
  constructor(
    public entityProperties: EntityProperties,
    public actionEntityProperties: ActionEntityProperties
  ) {}
}
