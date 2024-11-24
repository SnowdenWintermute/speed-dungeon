import {
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  EquipmentBaseItemEnum,
  EquipmentType,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { GameWorld } from ".";
import { equipmentBaseItemToModelPath } from "../combatant-models/equipment-base-item-to-model-path";
import { MeshBuilder, Vector3 } from "@babylonjs/core";
import {
  NextToBabylonMessageTypes,
  nextToBabylonMessageQueue,
} from "@/singletons/next-to-babylon-message-queue";

const ROW_SIZE = 20;
const ROW_SPACING = 1;
let i = 0;
let j = 0;

export default async function spawnTestEquipmentModels(world: GameWorld) {
  for (const [equipmentTypeString, baseItemEnum] of Object.entries(
    BASE_ITEMS_BY_EQUIPMENT_TYPE
  ).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
    const equipmentType = parseInt(equipmentTypeString) as EquipmentType;
    if (
      ![
        // EquipmentType.OneHandedMeleeWeapon,
        EquipmentType.TwoHandedMeleeWeapon,
        // EquipmentType.TwoHandedRangedWeapon,
        // EquipmentType.Shield,
      ].includes(equipmentType)
    )
      continue;

    spawnBaseItemModels(world, equipmentType, baseItemEnum);
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

async function spawnBaseItemModels(
  world: GameWorld,
  equipmentType: EquipmentType,
  baseItemEnum: EquipmentBaseItemEnum
) {
  console.log(iterateNumericEnum(baseItemEnum));
  for (const baseItemString of iterateNumericEnum(baseItemEnum).sort(
    (a, b) => parseInt(a) - parseInt(b)
  )) {
    const item = parseInt(baseItemString) as keyof EquipmentBaseItemEnum;
    i += 1;
    if (i > ROW_SIZE) {
      i = 0;
      j += 1;
    }

    const position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    const modelPath = equipmentBaseItemToModelPath(equipmentType, item);
    if (modelPath === null) {
      const parentMesh = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, world.scene);
      parentMesh.position = position;
    } else {
      const equipmentModel = await world.importMesh(modelPath);
      const parentMesh = equipmentModel.meshes[0];
      if (!parentMesh) {
        console.log("NO PARENT MESH");
        continue;
      }
      parentMesh.position = position;
    }
  }
}
