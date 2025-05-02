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
