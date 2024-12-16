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
  if (slot.slot === HoldableSlotType.OffHand) {
    if (equipment.equipmentBaseItemProperties.type === EquipmentType.Shield) {
      equipmentModel.meshes[0]?.translate(Vector3.Up(), -0.1);
      equipmentModel.meshes[0]?.translate(Vector3.Forward(), 0.06);
    } else {
      equipmentModel.meshes[0]?.translate(Vector3.Up(), 0.1);
      equipmentModel.meshes[0]?.translate(Vector3.Forward(), -0.05);
      equipmentModel.meshes[0]?.rotate(Vector3.Left(), -Math.PI);
    }

    equipmentModel.meshes[0]?.rotate(Vector3.Backward(), -Math.PI / 2);
    const equipmentBone = combatantModel.skeleton.meshes[0]
      ? getChildMeshByName(combatantModel.skeleton.meshes[0], "Wrist.L")
      : undefined;
    if (equipmentBone && equipmentModel.meshes[0]) equipmentModel.meshes[0].parent = equipmentBone;
  } else {
    equipmentModel.meshes[0]?.translate(Vector3.Up(), 0.1);
    equipmentModel.meshes[0]?.translate(Vector3.Forward(), -0.05);
    equipmentModel.meshes[0]?.rotate(Vector3.Backward(), Math.PI / 2);
    const equipmentBone = combatantModel.skeleton.meshes[0]
      ? getChildMeshByName(combatantModel.skeleton.meshes[0], "Wrist.R")
      : undefined;
    if (equipmentBone && equipmentModel.meshes[0]) equipmentModel.meshes[0].parent = equipmentBone;
  }
}
