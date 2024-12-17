import { ISceneLoaderAsyncResult, Vector3 } from "@babylonjs/core";
import {
  Equipment,
  EquipmentSlotType,
  EquipmentType,
  HoldableSlotType,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { ModularCharacter } from "./modular-character";
import { getChildMeshByName } from "../utils";

export default function attachEquipmentModelToSkeleton(
  combatantModel: ModularCharacter,
  equipmentModel: ISceneLoaderAsyncResult,
  slot: TaggedEquipmentSlot,
  equipment: Equipment
) {
  if (slot.type === EquipmentSlotType.Wearable) return;
  const parentMesh = equipmentModel.meshes[0];
  if (!parentMesh) return console.error("no parent mesh");
  if (slot.slot === HoldableSlotType.OffHand) {
    if (equipment.equipmentBaseItemProperties.type === EquipmentType.Shield) {
      // parentMesh.translate(Vector3.Up(), -0.1);
      parentMesh.position.y = -0.1;
      // parentMesh.translate(Vector3.Forward(), 0.06);
      parentMesh.position.z = 0.06;
    } else {
      // parentMesh.translate(Vector3.Up(), 0.1);
      parentMesh.position.y = 0.1;
      // parentMesh.translate(Vector3.Forward(), -0.05);
      parentMesh.position.z = -0.05;
      // parentMesh.rotate(Vector3.Left(), -Math.PI);
      // parentMesh.rotation.x = Math.PI;
    }

    parentMesh.rotate(Vector3.Backward(), -Math.PI / 2);
    const equipmentBone = combatantModel.skeleton.meshes[0]
      ? getChildMeshByName(combatantModel.skeleton.meshes[0], "Wrist.L")
      : undefined;
    if (equipmentBone && equipmentModel.meshes[0]) equipmentModel.meshes[0].parent = equipmentBone;
  } else {
    parentMesh.position.y = 0.1;
    parentMesh.position.z = -0.05;

    parentMesh.rotationQuaternion = null;
    parentMesh.rotation.z = Math.PI / 2;
    // parentMesh.rotation = new Vector3(0, 0, Math.PI / 2);

    const equipmentBone = combatantModel.skeleton.meshes[0]
      ? getChildMeshByName(combatantModel.skeleton.meshes[0], "Wrist.R")
      : undefined;
    if (equipmentBone && parentMesh) parentMesh.parent = equipmentBone;
  }
}
