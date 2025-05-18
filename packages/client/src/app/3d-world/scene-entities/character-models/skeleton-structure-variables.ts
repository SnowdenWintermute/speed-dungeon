export enum BoneName {
  Armature,
}

export const BONE_NAMES: Record<BoneName, string> = {
  [BoneName.Armature]: "CharacterArmature",
};

// export const ABSTRACT_PARENT_TYPE_TO_BONE_NAME: Record<EntityReferencePoint, BoneName> = {
//   [EntityReferencePoint.MainHandBone]: BoneName.EquipmentR,
//   [EntityReferencePoint.OffHandBone]: BoneName.EquipmentL,
//   [EntityReferencePoint.VfxEntityRoot]: BoneName.Root,
//   [EntityReferencePoint.CombatantHitboxCenter]: BoneName.Root,
//   [EntityReferencePoint.HeadBone]: BoneName.Head,
//   [EntityReferencePoint.NockBone]: BoneName.Nock,
//   [EntityReferencePoint.ArrowRest]: BoneName.ArrowRest,
// };
