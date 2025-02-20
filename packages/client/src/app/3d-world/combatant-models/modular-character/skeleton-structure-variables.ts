export enum SkeletonStructure {
  Quaternius,
  Mixamo,
  FreeMoCap,
}

export const SKELETON_STRUCTURE_TYPE = SkeletonStructure.Mixamo;

export const SKELETON_ARMATURE_NAMES: Record<SkeletonStructure, string> = {
  [SkeletonStructure.Quaternius]: "CharacterArmature",
  [SkeletonStructure.Mixamo]: "CharacterArmature",
  [SkeletonStructure.FreeMoCap]: "",
};

export const SKELETON_MAIN_HAND_NAMES: Record<SkeletonStructure, string> = {
  [SkeletonStructure.Quaternius]: "Wrist.R",
  [SkeletonStructure.Mixamo]: "mixamorig:RightHand",
  [SkeletonStructure.FreeMoCap]: "",
};

export const SKELETON_OFF_HAND_NAMES: Record<SkeletonStructure, string> = {
  [SkeletonStructure.Quaternius]: "Wrist.L",
  [SkeletonStructure.Mixamo]: "mixamorig:LeftHand",
  [SkeletonStructure.FreeMoCap]: "",
};

export const SKELETON_TORSO_NAMES: Record<SkeletonStructure, string> = {
  [SkeletonStructure.Quaternius]: "Torso",
  [SkeletonStructure.Mixamo]: "mixamorig:Spine2",
  [SkeletonStructure.FreeMoCap]: "",
};

export const SKELETON_HIPS_NAMES: Record<SkeletonStructure, string> = {
  [SkeletonStructure.Quaternius]: "Hips",
  [SkeletonStructure.Mixamo]: "mixamorig:Hips",
  [SkeletonStructure.FreeMoCap]: "",
};
