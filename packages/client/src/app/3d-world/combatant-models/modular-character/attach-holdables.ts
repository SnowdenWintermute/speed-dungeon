import { AbstractMesh, ISceneLoaderAsyncResult, Vector3 } from "@babylonjs/core";
import {
  CombatantClass,
  Equipment,
  EquipmentType,
  HoldableSlotType,
  TwoHandedMeleeWeapon,
  equipmentIsTwoHandedWeapon,
} from "@speed-dungeon/common";
import { ModularCharacter } from "./index";
import { getChildMeshByName } from "../../utils";

function setMeshPositionAndRotationToZero(mesh: AbstractMesh) {
  setMeshRotationToZero(mesh);
  mesh.position.x = 0;
  mesh.position.y = 0;
  mesh.position.z = 0;
}

function setMeshRotationToZero(mesh: AbstractMesh) {
  mesh.rotationQuaternion = null;
  mesh.rotation.x = 0;
  mesh.rotation.y = 0;
  mesh.rotation.z = 0;
}

export function attachHoldableModelToSkeleton(
  combatantModel: ModularCharacter,
  equipmentModel: ISceneLoaderAsyncResult,
  slot: HoldableSlotType,
  equipment: Equipment
) {
  const parentMesh = equipmentModel.meshes[0];
  if (!parentMesh) return console.error("no parent mesh");
  // setMeshPositionAndRotationToZero(parentMesh);
  setMeshPositionAndRotationToZero(parentMesh);

  if (slot === HoldableSlotType.OffHand) {
    if (equipment.equipmentBaseItemProperties.type === EquipmentType.Shield) {
      parentMesh.position.y = -0.1;
      parentMesh.position.z = 0.08;

      parentMesh.rotation.y = Math.PI;
      parentMesh.rotation.z = Math.PI / 2;
    } else {
      parentMesh.position.y = 0.1;
      parentMesh.position.z = -0.05;
      parentMesh.rotation.z = -Math.PI / 2;
    }

    const equipmentBone = combatantModel.skeleton.meshes[0]
      ? getChildMeshByName(combatantModel.skeleton.meshes[0], "Wrist.L")
      : undefined;
    if (equipmentBone && equipmentModel.meshes[0]) equipmentModel.meshes[0].parent = equipmentBone;
  } else if (slot === HoldableSlotType.MainHand) {
    parentMesh.position.y = 0.1;
    parentMesh.position.z = -0.05;

    parentMesh.rotation.z = Math.PI / 2;
    parentMesh.rotation.x = Math.PI;

    const equipmentBone = combatantModel.skeleton.meshes[0]
      ? getChildMeshByName(combatantModel.skeleton.meshes[0], "Wrist.R")
      : undefined;
    if (equipmentBone && parentMesh) parentMesh.parent = equipmentBone;
  }
}

export function attachHoldableModelToHolsteredPosition(
  combatantModel: ModularCharacter,
  equipmentModel: ISceneLoaderAsyncResult,
  slot: HoldableSlotType,
  equipment: Equipment
) {
  const parentMesh = equipmentModel.meshes[0];
  if (!parentMesh) return console.error("no parent mesh");
  const skeletonParentMesh = combatantModel.skeleton.meshes[0];
  if (!skeletonParentMesh) return console.error("no skeleton mesh");
  const torsoBone = getChildMeshByName(skeletonParentMesh, "Torso");
  const hipsBone = getChildMeshByName(skeletonParentMesh, "Hips");
  if (!torsoBone || !hipsBone) return console.error("missing expected bones");
  setMeshPositionAndRotationToZero(parentMesh);

  parentMesh.parent = torsoBone;
  if (slot === HoldableSlotType.OffHand) {
    if (combatantModel.combatantClass === CombatantClass.Warrior) parentMesh.position.z = -0.22;
    else parentMesh.position.z = -0.15;
    if (equipment.equipmentBaseItemProperties.type === EquipmentType.Shield) {
      parentMesh.rotation.z = -Math.PI + 0.5;
      parentMesh.rotation.x = -Math.PI;
      parentMesh.rotation.y = -Math.PI;
    } else {
      parentMesh.position.y = 0.3;
      parentMesh.position.x = -0.1;

      parentMesh.rotation.z = Math.PI + 0.5;
      parentMesh.rotation.x = 0;
      parentMesh.rotation.y = 0;
    }
  } else if (slot === HoldableSlotType.MainHand) {
    if (equipmentIsTwoHandedWeapon(equipment.equipmentBaseItemProperties.type)) {
      if (combatantModel.combatantClass === CombatantClass.Warrior) parentMesh.position.z = 0.25;

      parentMesh.position.z = 0.14;
    } else parentMesh.position.z = -0.1;

    parentMesh.position.x = 0.1;

    if (equipment.equipmentBaseItemProperties.type === EquipmentType.TwoHandedMeleeWeapon) {
      // parentMesh.position.z = 0.1;
      switch (equipment.equipmentBaseItemProperties.baseItem as TwoHandedMeleeWeapon) {
        case TwoHandedMeleeWeapon.BoStaff:
        case TwoHandedMeleeWeapon.ElementalStaff:
        case TwoHandedMeleeWeapon.ElmStaff:
          parentMesh.position.y = 0;
          parentMesh.position.x = 0;
          break;
        case TwoHandedMeleeWeapon.RottingBranch:
        case TwoHandedMeleeWeapon.Spear:
        case TwoHandedMeleeWeapon.Bardiche:
        case TwoHandedMeleeWeapon.SplittingMaul:
        case TwoHandedMeleeWeapon.Maul:
        case TwoHandedMeleeWeapon.BattleAxe:
        case TwoHandedMeleeWeapon.Glaive:
        case TwoHandedMeleeWeapon.Trident:
        case TwoHandedMeleeWeapon.MahoganyStaff:
        case TwoHandedMeleeWeapon.EbonyStaff:
          parentMesh.position.y = -0.2;
          parentMesh.position.x = 0.15;
          break;
        case TwoHandedMeleeWeapon.GreatAxe:
        case TwoHandedMeleeWeapon.GravityHammer:
          parentMesh.position.y = -0.4;
          parentMesh.position.x = 0.35;
          break;
      }

      parentMesh.rotation.z = 0.6;
      parentMesh.rotation.x = 0;
      parentMesh.rotation.y = 0;
      parentMesh.rotateAround(Vector3.Zero(), Vector3.Up(), Math.PI);
    } else if (equipment.equipmentBaseItemProperties.type === EquipmentType.TwoHandedRangedWeapon) {
      // parentMesh.position.z = 0.1;
      parentMesh.position.y = 0;
      parentMesh.position.x = 0;

      parentMesh.rotation.z = 0.6;
      parentMesh.rotation.x = 0;
      parentMesh.rotation.y = 0;
      parentMesh.rotateAround(Vector3.Zero(), Vector3.Up(), Math.PI);
    } else {
      parentMesh.position.y = 0.3;

      parentMesh.rotation.z = Math.PI + 0.5;
      parentMesh.rotation.x = 0;
      parentMesh.rotation.y = Math.PI;
    }
  }
}

// HIP POSITIONS
// parentMesh.parent = hipsBone;
// parentMesh.position.x = 0.15;
// parentMesh.position.z = 0.2;
// parentMesh.position.y = 0.1;

// parentMesh.rotation.z = -Math.PI / 2 - 0.25;
// parentMesh.rotation.x = -0.3;
// parentMesh.rotation.y = Math.PI / 2;
//
//
// parentMesh.parent = hipsBone;
// parentMesh.position.x = -0.15;
// parentMesh.position.z = 0.2;
// parentMesh.position.y = 0.1;
// parentMesh.rotation.z = Math.PI / 2 + 0.25;
// parentMesh.rotation.x = -0.3;
// parentMesh.rotation.y = -Math.PI / 2;
