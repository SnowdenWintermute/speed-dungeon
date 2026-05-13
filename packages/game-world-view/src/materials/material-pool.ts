import { Color3, Scene, StandardMaterial } from "@babylonjs/core";
import {
  ACCENT_COLOR_STRINGS,
  ACCENT_COLORS,
  AccentColor,
  CustomMaterial,
  DEFAULT_MATERIAL_COLORS,
  ELEMENT_COLORS,
  MATERIAL_CATEGORY_STRINGS,
  MATERIAL_LABEL_STRINGS,
  MATERIAL_SHADE_STRINGS,
  MaterialCategory,
  MaterialLabel,
  MaterialShade,
  METAL_COLORS,
  PLASTIC_COLOR_STRINGS,
  PLASTIC_COLORS,
  PlasticColor,
  WOOD_COLORS,
} from "./material-colors";
import {
  MAGICAL_ELEMENT_STRINGS,
  MagicalElement,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

export interface SavedMaterials {
  [MaterialCategory.Default]: Record<MaterialLabel, StandardMaterial>;
  [MaterialCategory.Wood]: Record<MaterialShade, StandardMaterial>;
  [MaterialCategory.Metal]: Record<MaterialShade, StandardMaterial>;
  [MaterialCategory.Plastic]: Record<PlasticColor, StandardMaterial>;
  [MaterialCategory.Accent]: Record<AccentColor, StandardMaterial>;
  [MaterialCategory.Element]: Record<MagicalElement, StandardMaterial>;
  [MaterialCategory.Custom]: Record<CustomMaterial, StandardMaterial>;
}

export class MaterialPool {
  readonly savedMaterials: SavedMaterials;
  constructor(private scene: Scene) {
    this.savedMaterials = this.createDefaultMaterials();
  }

  private createDefaultMaterials(): SavedMaterials {
    return {
      [MaterialCategory.Default]: this.generateMaterialsFromColors(
        DEFAULT_MATERIAL_COLORS,
        MATERIAL_LABEL_STRINGS,
        MATERIAL_CATEGORY_STRINGS[MaterialCategory.Default],
        255
      ),
      [MaterialCategory.Wood]: this.generateMaterialsFromColors(
        WOOD_COLORS,
        MATERIAL_SHADE_STRINGS,
        MATERIAL_CATEGORY_STRINGS[MaterialCategory.Wood],
        255
      ),
      [MaterialCategory.Metal]: this.generateMaterialsFromColors(
        METAL_COLORS,
        MATERIAL_SHADE_STRINGS,
        MATERIAL_CATEGORY_STRINGS[MaterialCategory.Metal],
        1
      ),
      [MaterialCategory.Plastic]: this.generateMaterialsFromColors(
        PLASTIC_COLORS,
        PLASTIC_COLOR_STRINGS,
        MATERIAL_CATEGORY_STRINGS[MaterialCategory.Plastic],
        3
      ),
      [MaterialCategory.Element]: this.generateMaterialsFromColors(
        ELEMENT_COLORS,
        MAGICAL_ELEMENT_STRINGS,
        MATERIAL_CATEGORY_STRINGS[MaterialCategory.Element],
        255
      ),
      [MaterialCategory.Custom]: {
        [CustomMaterial.Ether]: (() => {
          const etherMaterial = new StandardMaterial("ether", this.scene);
          etherMaterial.diffuseColor = new Color3(0.486, 0.286, 0.878);
          etherMaterial.alpha = 0.4;
          etherMaterial.emissiveColor = new Color3(0.486, 0.286, 0.878);
          return etherMaterial;
        })(),
        [CustomMaterial.Ice]: (() => {
          const iceMaterial = new StandardMaterial("ice", this.scene);
          iceMaterial.diffuseColor = ELEMENT_COLORS[MagicalElement.Ice];
          iceMaterial.alpha = 0.6;
          return iceMaterial;
        })(),
        [CustomMaterial.AncientMetal]: (() => {
          const ancientMetal = new StandardMaterial("ancient-metal", this.scene);
          ancientMetal.emissiveColor = new Color3(0.094, 0.839, 0.812);
          return ancientMetal;
        })(),
      },
      [MaterialCategory.Accent]: this.generateMaterialsFromColors(
        ACCENT_COLORS,
        ACCENT_COLOR_STRINGS,
        MATERIAL_CATEGORY_STRINGS[MaterialCategory.Accent],
        255
      ),
    };
  }

  private generateMaterialsFromColors<K extends number>(
    colors: Record<K, Color3>,
    colorStrings: Record<K, string>,
    nameSuffix: string,
    roughness: number
  ): Record<K, StandardMaterial> {
    const result = {} as Record<K, StandardMaterial>;

    for (const [key, color] of iterateNumericEnumKeyedRecord(colors)) {
      const enumKey = Number(key) as K;
      const material = new StandardMaterial(colorStrings[key] + nameSuffix, this.scene);
      material.diffuseColor = color;
      material.specularColor = color;
      material.roughness = roughness;
      result[enumKey] = material;
    }

    return result;
  }
}
