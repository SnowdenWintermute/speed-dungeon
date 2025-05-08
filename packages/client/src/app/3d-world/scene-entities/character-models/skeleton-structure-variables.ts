import { EntityReferencePoint } from "@speed-dungeon/common";

export enum BoneName {
  Armature,
  Root,
  EquipmentR,
  EquipmentL,
  Torso,
  Head,
  Nock,
  ArrowRest,
}

export const BONE_NAMES: Record<BoneName, string> = {
  [BoneName.Armature]: "CharacterArmature",
  [BoneName.Root]: "root",
  [BoneName.EquipmentR]: "Equipment.R",
  [BoneName.EquipmentL]: "Equipment.L",
  [BoneName.Torso]: "",
  [BoneName.Head]: "DEF-head",
  [BoneName.Nock]: "nock",
  [BoneName.ArrowRest]: "arrow-rest",
};

export const ABSTRACT_PARENT_TYPE_TO_BONE_NAME: Record<EntityReferencePoint, BoneName> = {
  [EntityReferencePoint.MainHandBone]: BoneName.EquipmentR,
  [EntityReferencePoint.OffHandBone]: BoneName.EquipmentL,
  [EntityReferencePoint.VfxEntityRoot]: BoneName.Root,
  [EntityReferencePoint.CombatantHitboxCenter]: BoneName.Root,
  [EntityReferencePoint.HeadBone]: BoneName.Head,
  [EntityReferencePoint.NockBone]: BoneName.Nock,
  [EntityReferencePoint.ArrowRest]: BoneName.ArrowRest,
};
