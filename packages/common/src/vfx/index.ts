import { Vector3 } from "@babylonjs/core";
import { EntityId, EntityProperties } from "../primatives/index.js";

export enum MobileVfxName {
  Arrow,
}

export enum StaticVfxName {
  Explosion,
}

export enum VfxType {
  Mobile,
  Static,
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

export type StaticVfxProperties = {
  vfxType: VfxType.Static;
  position: Vector3;
  name: StaticVfxName;
  parentOption?: VfxParent;
};

export type VfxProperties = MobileVfxProperties | StaticVfxProperties;

export interface Vfx {
  entityProperties: EntityProperties;
  vfxProperties: VfxProperties;
}
