import { Vector3 } from "@babylonjs/core";
import { EntityId, EntityProperties } from "../primatives/index.js";

export enum MobileVfxName {
  Arrow,
  Explosion,
}

export enum VfxType {
  Mobile,
}

export enum VfxParentType {
  UserMainHand,
  // OffHand,
  // MainHandWeapon,
  // OffHandWeapon
}

export interface VfxParent {
  type: VfxParentType;
  parentEntityId: EntityId;
  offset?: Vector3;
}

export type MobileVfxProperties = {
  vfxType: VfxType.Mobile;
  position: Vector3;
  name: MobileVfxName;
  parentOption?: VfxParent;
};

export type VfxProperties = MobileVfxProperties;

export interface Vfx {
  entityProperties: EntityProperties;
  vfxProperties: VfxProperties;
}
