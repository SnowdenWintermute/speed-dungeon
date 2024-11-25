import { Color3, ISceneLoaderAsyncResult, StandardMaterial } from "@babylonjs/core";
import { GameWorld } from "..";
import {
  EquipmentType,
  Item,
  ItemPropertiesType,
  MagicalElement,
  OneHandedMeleeWeapon,
  Shield,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { DEFAULT_MATERIAL_COLORS } from "./material-colors";

export default function setDefaultMaterials(world: GameWorld, model: ISceneLoaderAsyncResult) {
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    for (const mesh of model.meshes) {
      if (mesh.material?.name === name) {
        const materialOption = world.defaultMaterials.default[name];
        if (materialOption) mesh.material = materialOption;
      }
    }
  }
}
