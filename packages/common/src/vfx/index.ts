import { Vector3 } from "@babylonjs/core";
import { EntityId, EntityProperties } from "../primatives/index.js";

export enum MobileVfxName {
  Arrow,
  IceBolt,
  Explosion,
}

export const MOBILE_VFX_NAME_STRINGS: Record<MobileVfxName, string> = {
  [MobileVfxName.Arrow]: "Arrow",
  [MobileVfxName.IceBolt]: "Ice Bolt",
  [MobileVfxName.Explosion]: "Explosion",
};

export enum VfxType {
  Mobile,
}

export enum VfxParentType {
  UserMainHand,
  UserOffHand,
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

export class Vfx {
  constructor(
    public entityProperties: EntityProperties,
    public vfxProperties: VfxProperties
  ) {}
}
