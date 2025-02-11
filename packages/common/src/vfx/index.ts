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
  name: MobileVfxName;
};

export type StaticVfxProperties = {
  vfxType: VfxType.Mobile;
  name: StaticVfxName;
};

export type VfxProperties = MobileVfxProperties | StaticVfxProperties;

export interface Vfx {
  entityProperties: EntityProperties;
  vfxProperties: VfxProperties;
}
