import { AbstractMesh, AssetContainer, Color3, Scene, StandardMaterial } from "@babylonjs/core";
import { MaterialPool } from "./material-pool";
import { EquipmentMaterialsMap, createEquipmentMaterialsMap } from "./equipment-materials";
import {
  Consumable,
  ConsumableType,
  Equipment,
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import { MATERIAL_NAMES } from "@/game-world-view/materials/material-colors";
import { AccentColor, MaterialCategory, MaterialShade, PlasticColor } from "./material-colors";

export class MaterialManager {
  private materialPool: MaterialPool;
  private equipmentMaterialsMap: EquipmentMaterialsMap;

  constructor(private scene: Scene) {
    this.materialPool = new MaterialPool(scene);
    this.equipmentMaterialsMap = createEquipmentMaterialsMap(
      this.scene,
      this.materialPool.savedMaterials
    );
  }

  applyMaterialsToModelMeshes(
    assetContainer: AssetContainer,
    materialNamesToMaterials: { [materialName: string]: StandardMaterial },
    createUniqueInstance: boolean
  ) {
    for (const mesh of assetContainer.meshes) {
      for (const [materialName, material] of Object.entries(materialNamesToMaterials)) {
        if (mesh.material?.name !== materialName) {
          continue;
        }
        this.replaceMaterialOnMesh(mesh, assetContainer, material, createUniqueInstance);
      }
    }
  }

  private replaceMaterialOnMesh(
    mesh: AbstractMesh,
    container: AssetContainer,
    material: StandardMaterial,
    createUniqueInstance: boolean
  ) {
    const oldMaterial = mesh.material;

    if (createUniqueInstance) {
      const uniqueInstance = material.clone(material.name);
      uniqueInstance.emissiveColor.r = material.emissiveColor.r;
      uniqueInstance.emissiveColor.g = material.emissiveColor.g;
      uniqueInstance.emissiveColor.b = material.emissiveColor.b;
      uniqueInstance.diffuseColor.r = material.diffuseColor.r;
      uniqueInstance.diffuseColor.g = material.diffuseColor.g;
      uniqueInstance.diffuseColor.b = material.diffuseColor.b;
      uniqueInstance.roughness = material.roughness;
      uniqueInstance.specularColor.r = material.specularColor.r;
      uniqueInstance.specularColor.g = material.specularColor.g;
      uniqueInstance.specularColor.b = material.specularColor.b;
      uniqueInstance.specularPower = material.specularPower;
      uniqueInstance.alpha = material.alpha;
      mesh.material = uniqueInstance;
      container.materials.push(uniqueInstance); // so it can be properly disposed later
    } else {
      mesh.material = material;
    }
    oldMaterial?.dispose();
  }

  private getEquipmentMaterials(item: Equipment) {
    const props = item.equipmentBaseItemProperties;

    switch (props.equipmentType) {
      case EquipmentType.OneHandedMeleeWeapon: {
        const map = this.equipmentMaterialsMap[EquipmentType.OneHandedMeleeWeapon];
        const base = props.taggedBaseEquipment.baseItemType as OneHandedMeleeWeapon;
        return map[base](item);
      }
      case EquipmentType.TwoHandedMeleeWeapon: {
        const map = this.equipmentMaterialsMap[EquipmentType.TwoHandedMeleeWeapon];
        const base = props.taggedBaseEquipment.baseItemType as TwoHandedMeleeWeapon;
        return map[base](item);
      }
      case EquipmentType.TwoHandedRangedWeapon: {
        const map = this.equipmentMaterialsMap[EquipmentType.TwoHandedRangedWeapon];
        const base = props.taggedBaseEquipment.baseItemType as TwoHandedRangedWeapon;
        return map[base](item);
      }
      case EquipmentType.Shield: {
        const map = this.equipmentMaterialsMap[EquipmentType.Shield];
        const base = props.taggedBaseEquipment.baseItemType as Shield;
        return map[base](item);
      }
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Ring:
      case EquipmentType.Amulet:
        return;
    }
  }

  assignEquipmentMaterials(
    item: Equipment,
    itemModel: AssetContainer,
    createUniqueInstances: boolean
  ) {
    const materials = this.getEquipmentMaterials(item);
    if (materials === undefined) {
      return;
    }
    if (!materials[MATERIAL_NAMES.BLADE]) {
      materials[MATERIAL_NAMES.BLADE] =
        this.materialPool.savedMaterials[MaterialCategory.Metal][MaterialShade.Lighter];
    }
    if (!materials[MATERIAL_NAMES.ACCENT_1]) {
      materials[MATERIAL_NAMES.ACCENT_1] =
        this.materialPool.savedMaterials[MaterialCategory.Metal][MaterialShade.Lightest];
    }
    this.applyMaterialsToModelMeshes(itemModel, materials, createUniqueInstances);
  }

  assignConsumableMaterials(item: Consumable, itemModel: AssetContainer) {
    const materials: { [name: string]: StandardMaterial } = {};
    const saved = this.materialPool.savedMaterials;

    switch (item.consumableType) {
      case ConsumableType.HpAutoinjector:
        materials[MATERIAL_NAMES.ACCENT_1] = saved[MaterialCategory.Accent][AccentColor.HPGreen];
        materials[MATERIAL_NAMES.ACCENT_2] = saved[MaterialCategory.Plastic][PlasticColor.Blue];
        materials[MATERIAL_NAMES.ACCENT_3] = saved[MaterialCategory.Plastic][PlasticColor.Yellow];
        materials[MATERIAL_NAMES.MAIN] = saved[MaterialCategory.Plastic][PlasticColor.White];
        materials[MATERIAL_NAMES.ALTERNATE] = saved[MaterialCategory.Plastic][PlasticColor.Orange];
        break;
      case ConsumableType.MpAutoinjector:
        materials[MATERIAL_NAMES.ACCENT_1] = saved[MaterialCategory.Accent][AccentColor.MPBlue];
        materials[MATERIAL_NAMES.ACCENT_2] = saved[MaterialCategory.Plastic][PlasticColor.Blue];
        materials[MATERIAL_NAMES.ACCENT_3] = saved[MaterialCategory.Plastic][PlasticColor.Yellow];
        materials[MATERIAL_NAMES.MAIN] = saved[MaterialCategory.Plastic][PlasticColor.White];
        materials[MATERIAL_NAMES.ALTERNATE] = saved[MaterialCategory.Plastic][PlasticColor.Orange];
        break;
      case ConsumableType.StackOfShards:
      case ConsumableType.WarriorSkillbook:
      case ConsumableType.RogueSkillbook:
      case ConsumableType.MageSkillbook:
    }

    this.applyMaterialsToModelMeshes(itemModel, materials, false);
  }

  static lighten(color: Color3, amount: number): Color3 {
    return Color3.Lerp(color, Color3.White(), amount);
  }

  static darken(color: Color3, amount: number): Color3 {
    return Color3.Lerp(color, Color3.Black(), amount);
  }

  static desaturate(color: Color3, amount: number): Color3 {
    const gray = new Color3(
      (color.r + color.g + color.b) / 3,
      (color.r + color.g + color.b) / 3,
      (color.r + color.g + color.b) / 3
    );
    return Color3.Lerp(color, gray, amount);
  }
}
