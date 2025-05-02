import { AbstractParentType } from "@speed-dungeon/common";

export enum BoneName {
  Armature,
  Root,
  EquipmentR,
  EquipmentL,
  Torso,
}

export const BONE_NAMES: Record<BoneName, string> = {
  [BoneName.Armature]: "CharacterArmature",
  [BoneName.Root]: "root",
  [BoneName.EquipmentR]: "Equipment.R",
  [BoneName.EquipmentL]: "Equipment.L",
  [BoneName.Torso]: "",
};

export const ABSTRACT_PARENT_TYPE_TO_BONE_NAME: Record<AbstractParentType, BoneName> = {
  [AbstractParentType.UserMainHand]: BoneName.EquipmentR,
  [AbstractParentType.UserOffHand]: BoneName.EquipmentL,
  [AbstractParentType.VfxEntityRoot]: BoneName.Root,
  [AbstractParentType.CombatantHitboxCenter]: BoneName.Root,
};
