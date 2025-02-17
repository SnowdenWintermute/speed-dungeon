import { Vector3 } from "@babylonjs/core";
import { EntityProperties } from "../primatives/index.js";

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

export type MobileVfxProperties = {
  vfxType: VfxType.Mobile;
  position: Vector3;
  name: MobileVfxName;
};

export type StaticVfxProperties = {
  vfxType: VfxType.Static;
  position: Vector3;
  name: StaticVfxName;
};

export type VfxProperties = MobileVfxProperties | StaticVfxProperties;

export interface Vfx {
  entityProperties: EntityProperties;
  vfxProperties: VfxProperties;
}
