import { Color3, ISceneLoaderAsyncResult, StandardMaterial, Vector3 } from "@babylonjs/core";
import {
  EquipmentProperties,
  EquipmentSlot,
  EquipmentType,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { ModularCharacter } from "./modular-character";
import { getChildMeshByName } from "../utils";

export default function attachEquipmentModelToSkeleton(
  combatantModel: ModularCharacter,
  equipmentModel: ISceneLoaderAsyncResult,
  slot: EquipmentSlot,
  equipmentProperties: EquipmentProperties
) {
  if (slot === EquipmentSlot.OffHand) {
    if (equipmentProperties.equipmentBaseItemProperties.type === EquipmentType.Shield) {
      equipmentModel.meshes[0]?.translate(Vector3.Up(), -0.1);
      equipmentModel.meshes[0]?.translate(Vector3.Forward(), 0.06);
      equipmentModel.meshes[0]?.rotate(Vector3.Backward(), -Math.PI / 2);
    } else {
      equipmentModel.meshes[0]?.translate(Vector3.Up(), 0.1);
      equipmentModel.meshes[0]?.translate(Vector3.Forward(), -0.05);
      equipmentModel.meshes[0]?.rotate(Vector3.Backward(), -Math.PI / 2);
    }
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

function modifyColors(
  equipmentProperties: EquipmentProperties,
  equipmentModel: ISceneLoaderAsyncResult
) {
  if (
    equipmentProperties.equipmentBaseItemProperties.type === EquipmentType.TwoHandedMeleeWeapon &&
    equipmentProperties.equipmentBaseItemProperties.baseItem === TwoHandedMeleeWeapon.BoStaff
  ) {
    const meshes = equipmentModel.meshes;
    for (const mesh of meshes) {
      if (mesh.material?.name === "Accent1") {
        const newMaterial = new StandardMaterial("red");
        newMaterial.emissiveColor = new Color3(0.0, 0.9, 0.9);
        newMaterial.emissiveFresnelParameters;
        newMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
        mesh.material = newMaterial;
      }
    }
  }
}
