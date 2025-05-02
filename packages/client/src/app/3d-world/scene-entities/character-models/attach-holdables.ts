import { AbstractMesh, ISceneLoaderAsyncResult, Vector3 } from "@babylonjs/core";
import {
  Equipment,
  EquipmentBaseItem,
  EquipmentType,
  HoldableSlotType,
  OneHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { CharacterModel } from "./index";
import { getChildMeshByName } from "../../utils";
import { BONE_NAMES, BoneName } from "./skeleton-structure-variables";

function setMeshPositionAndRotationToZero(mesh: AbstractMesh) {
  setMeshRotationToZero(mesh);
  mesh.setPositionWithLocalVector(Vector3.Zero());
}

function setMeshRotationToZero(mesh: AbstractMesh) {
  mesh.rotationQuaternion = null;
  mesh.rotation = Vector3.Zero();
}

export function attachHoldableModelToSkeleton(
  combatantModel: CharacterModel,
  equipmentModel: ISceneLoaderAsyncResult,
  slot: HoldableSlotType,
  equipment: Equipment
) {
  const parentMesh = equipmentModel.meshes[0];
  if (!parentMesh) return console.error("no equipment parent mesh");
  const skeletonRoot = combatantModel.skeleton.meshes[0];
  if (!skeletonRoot) return console.error("no skeleton root");

  let equipmentBoneName: string = "";

  const { equipmentType } = equipment.equipmentBaseItemProperties;

  if (slot === HoldableSlotType.OffHand && equipmentType === EquipmentType.Shield) {
    // this is separate if we wanted to make a "shield bone"
    equipmentBoneName = BONE_NAMES[BoneName.EquipmentL];
  } else if (slot === HoldableSlotType.OffHand) {
    equipmentBoneName = BONE_NAMES[BoneName.EquipmentL];
  } else if (slot === HoldableSlotType.MainHand) {
    const isBow =
      equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon;
    if (isBow) equipmentBoneName = BONE_NAMES[BoneName.EquipmentL];
    else equipmentBoneName = equipmentBoneName = BONE_NAMES[BoneName.EquipmentR];
  } else {
    console.log("no equipment bone name condition met");
  }

  const equipmentBone = getChildMeshByName(skeletonRoot, equipmentBoneName) as AbstractMesh;

  if (!equipmentBone) return console.log("no equipment bone found");

  parentMesh.setParent(equipmentBone);
  setMeshPositionAndRotationToZero(parentMesh);

  if (slot === HoldableSlotType.OffHand) {
    parentMesh.rotation.y = Math.PI;

    // why do we have to do this? no idea
    if (combatantModel.monsterType !== null) {
      parentMesh.rotation.y += Math.PI;
    }

    if (equipmentType === EquipmentType.Shield) {
      parentMesh.position.z = -0.08;
      parentMesh.position.x = -0.15;
    }
  }

  if (equipmentType === EquipmentType.TwoHandedRangedWeapon) {
    parentMesh.rotate(Vector3.Up(), Math.PI);
  }

  if (combatantModel.monsterType !== null) {
    // why do we have to do this? no idea
    parentMesh.rotation.x += Math.PI;
  }
}

export function attachHoldableModelToHolsteredPosition(
  combatantModel: CharacterModel,
  equipmentModel: ISceneLoaderAsyncResult,
  slot: HoldableSlotType,
  equipment: Equipment
) {
  const equipmentParentMesh = equipmentModel.meshes[0];
  if (!equipmentParentMesh) return console.error("no parent mesh");
  const skeletonRoot = combatantModel.skeleton.meshes[0];
  if (!skeletonRoot) return console.error("no skeleton mesh");

  const backHolsterBoneName = slot === HoldableSlotType.OffHand ? "BackHolster.L" : "BackHolster.R";
  const hipHolsterBoneName = slot === HoldableSlotType.OffHand ? "HipHolster.L" : "HipHolster.R";
  const holsterBackBone = getChildMeshByName(skeletonRoot, backHolsterBoneName);
  const holsterHipBone = getChildMeshByName(skeletonRoot, hipHolsterBoneName);
  if (!holsterBackBone || !holsterHipBone) throw new Error("expected holster bones missing");
  const { taggedBaseEquipment } = equipment.equipmentBaseItemProperties;
  const { equipmentType, baseItemType } = taggedBaseEquipment;

  const holsterAtHip = shouldHolsterAtHip(taggedBaseEquipment);

  if (holsterAtHip) {
    equipmentParentMesh.setParent(holsterHipBone);
    setMeshPositionAndRotationToZero(equipmentParentMesh);
    equipmentParentMesh.rotation.y = -Math.PI / 2;
  } else {
    equipmentParentMesh.setParent(holsterBackBone);
    setMeshPositionAndRotationToZero(equipmentParentMesh);
    if (equipmentType === EquipmentType.Shield) {
      console.log("set parent to back");
      equipmentParentMesh.rotation.y = Math.PI;
      equipmentParentMesh.rotation.z = Math.PI;
      equipmentParentMesh.position.y = 0.15;
    } else if (equipmentType === EquipmentType.TwoHandedRangedWeapon) {
      equipmentParentMesh.position.y = 0.18;
      equipmentParentMesh.position.x = 0.07;
      equipmentParentMesh.rotation.y = Math.PI;
    } else {
      // move most weapons up a little
      equipmentParentMesh.position.y = -0.15;
    }
  }
}

const HIP_HOLSTERED_WEAPONS: OneHandedMeleeWeapon[] = [
  OneHandedMeleeWeapon.ButterKnife,
  OneHandedMeleeWeapon.Dagger,
];

function shouldHolsterAtHip(taggedBaseEquipment: EquipmentBaseItem) {
  const { equipmentType, baseItemType } = taggedBaseEquipment;

  return (
    equipmentType === EquipmentType.OneHandedMeleeWeapon &&
    HIP_HOLSTERED_WEAPONS.includes(baseItemType)
  );
}
