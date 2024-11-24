import {
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { GameWorld } from ".";
import { equipmentBaseItemToModelPath } from "../combatant-models/equipment-base-item-to-model-path";
import { MeshBuilder, Vector3 } from "@babylonjs/core";
import {
  NextToBabylonMessageTypes,
  nextToBabylonMessageQueue,
} from "@/singletons/next-to-babylon-message-queue";

export default async function spawnTestEquipmentModels(world: GameWorld) {
  const ROW_SIZE = 10;
  const ROW_SPACING = 1;
  let i = 0;
  let j = 0;
  for (const item of iterateNumericEnum(OneHandedMeleeWeapon)) {
    i += 1;
    if (i > ROW_SIZE) {
      i = 0;
      j += 1;
    }

    const modelPath = equipmentBaseItemToModelPath(EquipmentType.OneHandedMeleeWeapon, item);
    if (modelPath === null) {
      const parentMesh = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, world.scene);
      parentMesh.position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    } else {
      const equipmentModel = await world.importMesh(modelPath);
      const parentMesh = equipmentModel.meshes[0];
      if (!parentMesh) continue;
      parentMesh.position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    }
  }

  for (const item of iterateNumericEnum(Shield)) {
    i += 1;
    if (i > ROW_SIZE) {
      i = 0;
      j += 1;
    }

    const modelPath = equipmentBaseItemToModelPath(EquipmentType.Shield, item);
    if (modelPath === null) {
      const parentMesh = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, world.scene);
      parentMesh.position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    } else {
      const equipmentModel = await world.importMesh(modelPath);
      const parentMesh = equipmentModel.meshes[0];
      if (!parentMesh) continue;
      parentMesh.position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    }
  }

  for (const item of iterateNumericEnum(TwoHandedMeleeWeapon)) {
    i += 1;
    if (i > ROW_SIZE) {
      i = 0;
      j += 1;
    }

    const modelPath = equipmentBaseItemToModelPath(EquipmentType.TwoHandedMeleeWeapon, item);
    if (modelPath === null) {
      const parentMesh = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, world.scene);
      parentMesh.position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    } else {
      const equipmentModel = await world.importMesh(modelPath);
      const parentMesh = equipmentModel.meshes[0];
      if (!parentMesh) continue;
      parentMesh.position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    }
  }

  nextToBabylonMessageQueue.messages.push({
    type: NextToBabylonMessageTypes.MoveCamera,
    instant: true,
    alpha: Math.PI / 2,
    beta: (Math.PI / 5) * 2,
    radius: 7,
    target: new Vector3(ROW_SIZE / 2, 3, 0),
  });
}
