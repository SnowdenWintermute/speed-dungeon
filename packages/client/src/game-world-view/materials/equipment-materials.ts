import { Scene, StandardMaterial } from "@babylonjs/core";
import {
  Equipment,
  EquipmentBaseItemEnum,
  EquipmentType,
  MAGICAL_ELEMENT_STRINGS,
  MagicalElement,
  OneHandedMeleeWeapon,
  ResourceChangeSource,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import {
  AccentColor,
  CustomMaterial,
  DYNAMIC_MATERIAL_TAG,
  ELEMENT_COLORS,
  MaterialCategory,
  MaterialShade,
} from "./material-colors";
import { MATERIAL_NAMES } from "@/game-world-view/materials/material-colors";
import { SavedMaterials } from "./material-pool";
import { MaterialManager } from "./material-manager";

const { MAIN, ALTERNATE, ACCENT_1, ACCENT_2, ACCENT_3, HILT, HANDLE, BLADE } = MATERIAL_NAMES;

export interface EquipmentMaterialsMap
  extends Record<
    keyof EquipmentBaseItemEnum,
    undefined | Record<EquipmentType, (e: Equipment) => Record<string, StandardMaterial>>
  > {
  [EquipmentType.OneHandedMeleeWeapon]: Record<
    OneHandedMeleeWeapon,
    (e: Equipment) => Record<string, StandardMaterial>
  >;
  [EquipmentType.TwoHandedMeleeWeapon]: Record<
    TwoHandedMeleeWeapon,
    (e: Equipment) => Record<string, StandardMaterial>
  >;
  [EquipmentType.TwoHandedRangedWeapon]: Record<
    TwoHandedRangedWeapon,
    (e: Equipment) => Record<string, StandardMaterial>
  >;
  [EquipmentType.Shield]: Record<Shield, (e: Equipment) => Record<string, StandardMaterial>>;
  [EquipmentType.BodyArmor]: undefined;
  [EquipmentType.HeadGear]: undefined;
  [EquipmentType.Ring]: undefined;
  [EquipmentType.Amulet]: undefined;
}

export function createEquipmentMaterialsMap(
  scene: Scene,
  saved: SavedMaterials
): EquipmentMaterialsMap {
  return {
    [EquipmentType.OneHandedMeleeWeapon]: oneHandedMelee(scene, saved),
    [EquipmentType.TwoHandedMeleeWeapon]: twoHandedMelee(saved),
    [EquipmentType.TwoHandedRangedWeapon]: twoHandedRanged(saved),
    [EquipmentType.Shield]: shield(saved),
    [EquipmentType.BodyArmor]: undefined,
    [EquipmentType.HeadGear]: undefined,
    [EquipmentType.Ring]: undefined,
    [EquipmentType.Amulet]: undefined,
  };
}

function oneHandedMelee(
  scene: Scene,
  saved: SavedMaterials
): Record<OneHandedMeleeWeapon, (equipment: Equipment) => Record<string, StandardMaterial>> {
  return {
    [OneHandedMeleeWeapon.Stick]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
    }),
    [OneHandedMeleeWeapon.Club]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [BLADE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),
    [OneHandedMeleeWeapon.Mace]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
    }),
    [OneHandedMeleeWeapon.Morningstar]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darkest],
      [BLADE]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [ACCENT_1]: saved[MaterialCategory.Metal][MaterialShade.Darker],
    }),
    [OneHandedMeleeWeapon.WarHammer]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ACCENT_1]: saved[MaterialCategory.Metal][MaterialShade.Darkest],
      [BLADE]: saved[MaterialCategory.Metal][MaterialShade.Darkest],
    }),
    [OneHandedMeleeWeapon.ButterKnife]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Metal][MaterialShade.Lightest],
    }),
    [OneHandedMeleeWeapon.ShortSword]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),
    [OneHandedMeleeWeapon.Blade]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Lightest],
    }),
    [OneHandedMeleeWeapon.BroadSword]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [BLADE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),
    [OneHandedMeleeWeapon.BastardSword]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [BLADE]: saved[MaterialCategory.Metal][MaterialShade.Darkest],
    }),
    [OneHandedMeleeWeapon.Dagger]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),
    [OneHandedMeleeWeapon.Rapier]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Brass],
    }),
    [OneHandedMeleeWeapon.ShortSpear]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [ACCENT_2]: saved[MaterialCategory.Accent][AccentColor.Rose],
    }),
    [OneHandedMeleeWeapon.RuneSword]: (equipment) => {
      return createRuneSwordMaterials(scene, saved, equipment);
    },
    [OneHandedMeleeWeapon.EtherBlade]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [BLADE]: saved[MaterialCategory.Custom][CustomMaterial.Ether],
    }),
    [OneHandedMeleeWeapon.IceBlade]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [BLADE]: saved[MaterialCategory.Custom][CustomMaterial.Ice],
      [ACCENT_2]: saved[MaterialCategory.Metal][MaterialShade.Darker],
    }),
    [OneHandedMeleeWeapon.MapleWand]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [MAIN]: saved[MaterialCategory.Wood][MaterialShade.Darker],
    }),
    [OneHandedMeleeWeapon.WillowWand]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Brass],
      [MAIN]: saved[MaterialCategory.Accent][AccentColor.CobaltBlue],
    }),
    [OneHandedMeleeWeapon.YewWand]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ALTERNATE]: saved[MaterialCategory.Accent][AccentColor.Brass],
      [ACCENT_1]: saved[MaterialCategory.Custom][CustomMaterial.Ether],
      [MAIN]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [HILT]: saved[MaterialCategory.Accent][AccentColor.Brass],
    }),
    [OneHandedMeleeWeapon.RoseWand]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [MAIN]: saved[MaterialCategory.Accent][AccentColor.Cherry],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Rose],
    }),
  };
}

function createRuneSwordMaterials(scene: Scene, saved: SavedMaterials, equipment: Equipment) {
  const weaponProperties = equipment.requireWeaponProperties();

  const result: Record<string, StandardMaterial> = {};

  let i = 1;
  for (const classification of weaponProperties.damageClassification) {
    if (classification.elementOption !== undefined) {
      const material = new StandardMaterial(
        DYNAMIC_MATERIAL_TAG + MAGICAL_ELEMENT_STRINGS[classification.elementOption],
        scene
      );

      const color = MaterialManager.desaturate(ELEMENT_COLORS[classification.elementOption], 0.25);
      material.diffuseColor = color;
      material.roughness = 0;
      result["Accent" + i] = material;
    }
    i += 1;
  }
  result[HANDLE] = saved[MaterialCategory.Metal][MaterialShade.Medium];
  result[HILT] = saved[MaterialCategory.Metal][MaterialShade.Darker];
  return result;
}

function twoHandedMelee(
  saved: SavedMaterials
): Record<TwoHandedMeleeWeapon, (equipment: Equipment) => Record<string, StandardMaterial>> {
  return {
    [TwoHandedMeleeWeapon.RottingBranch]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
    }),

    [TwoHandedMeleeWeapon.BoStaff]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [HILT]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [ACCENT_2]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [ACCENT_1]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
    }),

    [TwoHandedMeleeWeapon.Spear]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
    }),

    [TwoHandedMeleeWeapon.Bardiche]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Lighter],
    }),

    [TwoHandedMeleeWeapon.SplittingMaul]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ACCENT_2]: saved[MaterialCategory.Metal][MaterialShade.Darkest],
    }),

    [TwoHandedMeleeWeapon.Maul]: (_equipment) => ({
      [BLADE]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Brass],
    }),

    [TwoHandedMeleeWeapon.BattleAxe]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [ACCENT_2]: saved[MaterialCategory.Wood][MaterialShade.Darker],
    }),

    [TwoHandedMeleeWeapon.Glaive]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
    }),

    [TwoHandedMeleeWeapon.ElementalStaff]: (_equipment) => ({
      ...getElementalAccentMaterials(
        saved,
        _equipment.requireWeaponProperties().damageClassification
      ),
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [HILT]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
    }),

    [TwoHandedMeleeWeapon.Trident]: (_equipment) => ({
      [ACCENT_1]: saved[MaterialCategory.Element][MagicalElement.Water],
      [BLADE]: saved[MaterialCategory.Accent][AccentColor.Brass],
      [HILT]: saved[MaterialCategory.Accent][AccentColor.Brass],
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
    }),

    [TwoHandedMeleeWeapon.GreatAxe]: (_equipment) => ({
      [ALTERNATE]: saved[MaterialCategory.Custom][CustomMaterial.AncientMetal],
      [ACCENT_2]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [BLADE]: saved[MaterialCategory.Accent][AccentColor.DarkBlue],
      [HILT]: saved[MaterialCategory.Metal][MaterialShade.Darker],
    }),

    [TwoHandedMeleeWeapon.GravityHammer]: (_equipment) => ({
      [ACCENT_1]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [ACCENT_2]: saved[MaterialCategory.Custom][CustomMaterial.AncientMetal],
      [ALTERNATE]: saved[MaterialCategory.Accent][AccentColor.CobaltBlue],
      [BLADE]: saved[MaterialCategory.Accent][AccentColor.DarkBlue],
      [HANDLE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),

    [TwoHandedMeleeWeapon.ElmStaff]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.BurntOrange],
    }),

    [TwoHandedMeleeWeapon.MahoganyStaff]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Brass],
      [ALTERNATE]: saved[MaterialCategory.Custom][CustomMaterial.Ice],
    }),

    [TwoHandedMeleeWeapon.EbonyStaff]: (_equipment) => ({
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Darkest],
      [ALTERNATE]: saved[MaterialCategory.Accent][AccentColor.Cherry],
      [ACCENT_1]: saved[MaterialCategory.Wood][MaterialShade.Darker],
    }),
  };
}

function twoHandedRanged(
  saved: SavedMaterials
): Record<TwoHandedRangedWeapon, (equipment: Equipment) => Record<string, StandardMaterial>> {
  return {
    [TwoHandedRangedWeapon.ShortBow]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [HANDLE]: saved[MaterialCategory.Wood][MaterialShade.Lighter],
      [ACCENT_1]: saved[MaterialCategory.Wood][MaterialShade.Lightest],
    }),

    [TwoHandedRangedWeapon.RecurveBow]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ACCENT_1]: saved[MaterialCategory.Wood][MaterialShade.Lightest],
    }),

    [TwoHandedRangedWeapon.CompositeBow]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [HANDLE]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [ALTERNATE]: saved[MaterialCategory.Wood][MaterialShade.Lightest],
    }),

    [TwoHandedRangedWeapon.MilitaryBow]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Accent][AccentColor.DarkBlue],
      [HANDLE]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [ALTERNATE]: saved[MaterialCategory.Wood][MaterialShade.Lightest],
    }),

    [TwoHandedRangedWeapon.EtherBow]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [HANDLE]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [ALTERNATE]: saved[MaterialCategory.Custom][CustomMaterial.Ether],
      [ACCENT_1]: saved[MaterialCategory.Custom][CustomMaterial.Ether],
      [ACCENT_2]: saved[MaterialCategory.Metal][MaterialShade.Darker],
    }),
  };
}

function shield(
  saved: SavedMaterials
): Record<Shield, (equipment: Equipment) => Record<string, StandardMaterial>> {
  return {
    [Shield.PotLid]: (_equipment) => ({}),
    [Shield.CabinetDoor]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Wood][MaterialShade.Darker],
      [ALTERNATE]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Brass],
      [ACCENT_2]: saved[MaterialCategory.Wood][MaterialShade.Darkest],
    }),

    [Shield.Heater]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Metal][MaterialShade.Lighter],
      [ALTERNATE]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [ACCENT_1]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [ACCENT_2]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),

    [Shield.Buckler]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Metal][MaterialShade.Darker],
      [ALTERNATE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),

    [Shield.Pavise]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Wood][MaterialShade.Lightest],
      [ALTERNATE]: saved[MaterialCategory.Accent][AccentColor.BurntOrange],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Cherry],
    }),

    [Shield.Aspis]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [ALTERNATE]: saved[MaterialCategory.Accent][AccentColor.Cherry],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Cherry],
      [ACCENT_2]: saved[MaterialCategory.Accent][AccentColor.BurntOrange],
      [ACCENT_3]: saved[MaterialCategory.Accent][AccentColor.KellyGreen],
    }),

    [Shield.LanternShield]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [BLADE]: saved[MaterialCategory.Metal][MaterialShade.Lighter],
      [ALTERNATE]: saved[MaterialCategory.Accent][AccentColor.Brass],
    }),

    [Shield.KiteShield]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Metal][MaterialShade.Lighter],
      [ALTERNATE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
    }),

    [Shield.TowerShield]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Wood][MaterialShade.Medium],
      [ALTERNATE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [ACCENT_1]: saved[MaterialCategory.Accent][AccentColor.Brass],
    }),

    [Shield.AncientBuckler]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Accent][AccentColor.DarkBlue],
      [ALTERNATE]: saved[MaterialCategory.Accent][AccentColor.CobaltBlue],
      [ACCENT_1]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [ACCENT_2]: saved[MaterialCategory.Metal][MaterialShade.Lighter],
      [ACCENT_3]: saved[MaterialCategory.Custom][CustomMaterial.AncientMetal],
    }),

    [Shield.GothicShield]: (_equipment) => ({
      [MAIN]: saved[MaterialCategory.Accent][AccentColor.DarkBlue],
      [ALTERNATE]: saved[MaterialCategory.Metal][MaterialShade.Medium],
      [ACCENT_1]: saved[MaterialCategory.Metal][MaterialShade.Lighter],
    }),
  };
}

function getElementalAccentMaterials(
  savedMaterials: SavedMaterials,
  damageClassification: ResourceChangeSource[]
) {
  const result: Record<string, StandardMaterial> = {};
  let i = 1;
  for (const classification of damageClassification) {
    if (classification.elementOption !== undefined) {
      const material = savedMaterials[MaterialCategory.Element][classification.elementOption];
      result["Accent" + i] = material;
    }
    i += 1;
  }
  return result;
}
