import {
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  Equipment,
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
import setDefaultMaterials from "./materials/set-default-materials";
import { importMesh } from "../utils";
import { spawnItemModel } from "../combatant-models/spawn-item-models";

const ROW_SIZE = 10;
const ROW_SPACING = 1;
let i = 0;
let j = 0;

export default async function spawnTestEquipmentModels(world: GameWorld) {
  const baseEnums: EquipmentBaseItemEnum[] = [];
  for (const [equipmentTypeString, baseItemEnum] of Object.entries(
    BASE_ITEMS_BY_EQUIPMENT_TYPE
  ).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
    baseEnums.push(baseItemEnum);
    const equipmentType = parseInt(equipmentTypeString) as EquipmentType;
    if (
      ![
        EquipmentType.OneHandedMeleeWeapon,
        EquipmentType.TwoHandedMeleeWeapon,
        EquipmentType.TwoHandedRangedWeapon,
        EquipmentType.Shield,
      ].includes(equipmentType)
    )
      continue;

    await spawnBaseItemModels(world, equipmentType, baseItemEnum);
    i = 0;
    j += 1;
  }

  let enumLengthsSum: number = 0;
  baseEnums.forEach((item) => {
    enumLengthsSum += Object.values(item).length;
  });
  const enumLengthsAvg = enumLengthsSum / Object.values(baseEnums).length;

  nextToBabylonMessageQueue.messages.push({
    type: NextToBabylonMessageTypes.MoveCamera,
    instant: true,
    alpha: Math.PI / 2,
    beta: (Math.PI / 5) * 2,
    radius: 7,
    target: new Vector3(enumLengthsAvg / 2, 3, 0),
  });
}

async function spawnBaseItemModels(
  world: GameWorld,
  equipmentType: EquipmentType,
  baseItemEnum: EquipmentBaseItemEnum
) {
  for (const baseItemString of iterateNumericEnum(baseItemEnum).sort(
    (a, b) => parseInt(a) - parseInt(b)
  )) {
    const item = parseInt(baseItemString) as keyof EquipmentBaseItemEnum;
    i += 1;

    const position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
    const modelPath = equipmentBaseItemToModelPath(equipmentType, item);
    if (modelPath === null) {
      const parentMesh = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, world.scene);
      parentMesh.position = position;
    } else {
      const equipmentModel = await importMesh(modelPath, world.scene);
      const parentMesh = equipmentModel.meshes[0];
      if (!parentMesh) {
        console.error("NO PARENT MESH");
        continue;
      }
      setDefaultMaterials(equipmentModel, world.defaultMaterials);

      parentMesh.position = position;
    }
  }
}

export async function spawnEquipmentModelsFromItemList(world: GameWorld, items: Equipment[]) {
  const ROW_SPACING = 1;
  const ROW_SIZE = 10;
  let i = 0;
  let j = 0;

  nextToBabylonMessageQueue.messages.push({
    type: NextToBabylonMessageTypes.MoveCamera,
    instant: true,
    alpha: Math.PI / 2,
    beta: (Math.PI / 5) * 2,
    radius: 7,
    target: new Vector3(ROW_SIZE / 2, 3, 0),
  });

  items.sort((a, b) => {
    if (a instanceof Equipment && b instanceof Equipment) {
      return (
        a.equipmentBaseItemProperties.baseItem.equipmentType -
        b.equipmentBaseItemProperties.baseItem.equipmentType
      );
    }
    return 0;
  });

  for (const item of items) {
    i += 1;
    if (i > ROW_SIZE) {
      i = 0;
      j += 1;
    }
    const model = await spawnItemModel(item, world.scene, world.defaultMaterials);
    if (!(model instanceof Error)) {
      const parentMesh = model.meshes[0];
      if (!parentMesh) continue;

      const position = new Vector3(i * ROW_SPACING, 3, j * ROW_SPACING);
      parentMesh.position = position;
    }
  }
}
