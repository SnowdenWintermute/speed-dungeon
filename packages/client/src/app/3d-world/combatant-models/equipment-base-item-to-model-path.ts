import {
  EquipmentBaseItemType,
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";

export function equipmentBaseItemToModelPath(
  equipmentType: EquipmentType,
  baseItem: EquipmentBaseItemType | null
) {
  let filePath;
  const folderPath = MODEL_FOLDER_PATHS[equipmentType];
  switch (equipmentType) {
    case EquipmentType.BodyArmor:
      return null;
    case EquipmentType.HeadGear:
      return null;
    case EquipmentType.Ring:
      return null;
    case EquipmentType.Amulet:
      return null;
    case EquipmentType.OneHandedMeleeWeapon:
      filePath = ONE_HANDED_MELEE_WEAPON_MODEL_PATHS[baseItem as OneHandedMeleeWeapon];
      break;
    case EquipmentType.TwoHandedMeleeWeapon:
      filePath = TWO_HANDED_MELEE_WEAPON_MODEL_PATHS[baseItem as TwoHandedMeleeWeapon];
      break;
    case EquipmentType.TwoHandedRangedWeapon:
      filePath = TWO_HANDED_RANGED_WEAPON_MODEL_PATHS[baseItem as TwoHandedRangedWeapon];
      break;
    case EquipmentType.Shield:
      filePath = SHIELD_MODEL_PATHS[baseItem as Shield];
      break;
  }
  if (!folderPath || !filePath) return null;
  return folderPath + filePath;
}

export const MODEL_FOLDER_PATHS: Record<EquipmentType, null | string> = {
  [EquipmentType.BodyArmor]: null,
  [EquipmentType.HeadGear]: null,
  [EquipmentType.Ring]: null,
  [EquipmentType.Amulet]: null,
  [EquipmentType.OneHandedMeleeWeapon]: "equipment/holdables/one-handed-melee/",
  [EquipmentType.TwoHandedMeleeWeapon]: "equipment/holdables/two-handed-melee/",
  [EquipmentType.TwoHandedRangedWeapon]: "equipment/holdables/two-handed-ranged/",
  [EquipmentType.Shield]: "equipment/holdables/shields/",
};

export const ONE_HANDED_MELEE_WEAPON_MODEL_PATHS: Record<OneHandedMeleeWeapon, null | string> = {
  // [OneHandedMeleeWeapon.Stick]: "short-sword.glb", // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.Stick]: "stick.glb", // https://opengameart.org/content/wooden-stick
  [OneHandedMeleeWeapon.Mace]: "mace.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.Morningstar]: "morning-star.glb", // https://opengameart.org/content/medieval-weapon-pack
  [OneHandedMeleeWeapon.WarHammer]: "war-hammer.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.ShortSword]: "short-sword.glb", // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.Blade]: "blade.glb", // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.BroadSword]: "broad-sword.glb", // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.BastardSword]: "bastard-sword.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.Dagger]: "dagger.glb", // drummyfish
  [OneHandedMeleeWeapon.Rapier]: "rapier.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.ShortSpear]: "short-spear.glb", // quaternius
  [OneHandedMeleeWeapon.RuneSword]: "rune-sword.glb", // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.EtherBlade]: "ether-blade.glb", // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.IceBlade]: "ice-blade.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.MapleWand]: "maple-wand.glb", // https://opengameart.org/content/medieval-weapon-pack
  [OneHandedMeleeWeapon.WillowWand]: "willow-wand.glb", // self made
  [OneHandedMeleeWeapon.YewWand]: "yew-wand.glb", // https://opengameart.org/content/basic-wand
  [OneHandedMeleeWeapon.RoseWand]: "rose-wand.glb", // self made
};

export const TWO_HANDED_MELEE_WEAPON_MODEL_PATHS: Record<TwoHandedMeleeWeapon, null | string> = {
  // [TwoHandedMeleeWeapon.BoStaff]: "bardiche.glb",
  [TwoHandedMeleeWeapon.BoStaff]: "elemental-staff.glb", // https://opengameart.org/content/kingdom-weapon-set
  [TwoHandedMeleeWeapon.Spear]: "spear.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [TwoHandedMeleeWeapon.Bardiche]: "bardiche.glb", // https://opengameart.org/content/kingdom-weapon-set
  [TwoHandedMeleeWeapon.SplittingMaul]: "splitting-maul.glb", // https://opengameart.org/content/low-poly-axes-pack
  [TwoHandedMeleeWeapon.Maul]: "maul.glb", // https://opengameart.org/content/medieval-weapon-pack
  [TwoHandedMeleeWeapon.BattleAxe]: "battle-axe.glb", // https://opengameart.org/content/low-poly-axes-pack
  [TwoHandedMeleeWeapon.Glaive]: "glaive.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [TwoHandedMeleeWeapon.ElementalStaff]: "elemental-staff.glb", // https://opengameart.org/content/kingdom-weapon-set
  [TwoHandedMeleeWeapon.Trident]: "trident.glb", // https://poly.pizza/m/Z5URRESKKt
  [TwoHandedMeleeWeapon.GreatAxe]: "great-axe.glb", // https://opengameart.org/content/low-poly-axes-pack
  [TwoHandedMeleeWeapon.GravityHammer]: "gravity-hammer.glb", // https://opengameart.org/content/3d-hammer-pack
  [TwoHandedMeleeWeapon.ElmStaff]: "elm-staff.glb", // https://opengameart.org/content/medieval-weapon-pack
  [TwoHandedMeleeWeapon.MahoganyStaff]: "mahogany-staff.glb", // https://opengameart.org/content/weapons-pack-0
  [TwoHandedMeleeWeapon.EbonyStaff]: "ebony-staff.glb", // https://opengameart.org/content/stylised-fantasy-weapons
};

export const TWO_HANDED_RANGED_WEAPON_MODEL_PATHS: Record<TwoHandedRangedWeapon, null | string> = {
  // [TwoHandedRangedWeapon.ShortBow]: "composite-bow.glb",
  [TwoHandedRangedWeapon.ShortBow]: "short-bow.glb", // zsky
  [TwoHandedRangedWeapon.RecurveBow]: "recurve-bow.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [TwoHandedRangedWeapon.CompositeBow]: "composite-bow.glb", // quaternius
  [TwoHandedRangedWeapon.MilitaryBow]: "military-bow.glb", // quaternius
  [TwoHandedRangedWeapon.EtherBow]: "ether-bow.glb", // zsky
};

export const SHIELD_MODEL_PATHS: Record<Shield, null | string> = {
  // [Shield.MakeshiftBuckler]: "wooden-kite-shield.glb",
  [Shield.MakeshiftBuckler]: "makeshift-buckler.glb", // https://opengameart.org/content/trap-door
  [Shield.WoodenKiteShield]: "wooden-kite-shield.glb", // quaternius
  [Shield.Buckler]: "buckler.glb", // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [Shield.Pavise]: "pavise.glb", // self-made
  [Shield.Aspis]: "aspis.glb", // https://opengameart.org/content/stylised-fantasy-weapons
  [Shield.LanternShield]: "lantern-shield.glb", // https://opengameart.org/content/skeleton-warrior-0
  [Shield.KiteShield]: "kite-shield.glb", // https://opengameart.org/content/medieval-weapon-pack
  [Shield.TowerShield]: "tower-shield.glb", // quaternius
  [Shield.AncientBuckler]: "ancient-buckler.glb", // https://opengameart.org/content/iron-buckler
  [Shield.GothicShield]: "gothic-shield.glb", // https://opengameart.org/content/medieval-weapon-pack
};
