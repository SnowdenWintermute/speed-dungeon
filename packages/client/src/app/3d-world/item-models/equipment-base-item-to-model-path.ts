import {
  EquipmentBaseItem,
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import { Artist } from "./artists";

export function equipmentBaseItemToModelPath(baseItem: EquipmentBaseItem): string | null {
  let filePath;

  const folderPath = MODEL_FOLDER_PATHS[baseItem.equipmentType];
  switch (baseItem.equipmentType) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Ring:
    case EquipmentType.Amulet:
      return null;
    case EquipmentType.OneHandedMeleeWeapon:
      filePath = ONE_HANDED_MELEE_WEAPON_MODELS[baseItem.baseItemType].path;
      break;
    case EquipmentType.TwoHandedMeleeWeapon:
      filePath = TWO_HANDED_MELEE_WEAPON_MODELS[baseItem.baseItemType].path;
      break;
    case EquipmentType.TwoHandedRangedWeapon:
      filePath = TWO_HANDED_RANGED_WEAPON_MODELS[baseItem.baseItemType].path;
      break;
    case EquipmentType.Shield:
      filePath = SHIELD_MODELS[baseItem.baseItemType].path;
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

export const ONE_HANDED_MELEE_WEAPON_MODELS: Record<
  OneHandedMeleeWeapon,
  { path: null | string; artist: Artist }
> = {
  // [OneHandedMeleeWeapon.Stick]: "short-sword.glb", // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.Stick]: { path: "stick.glb", artist: Artist.OveractionGS }, // https://opengameart.org/content/wooden-stick
  [OneHandedMeleeWeapon.Club]: { path: "club.glb", artist: Artist.Mastahcez }, // https://opengameart.org/content/stylised-fantasy-weapons
  [OneHandedMeleeWeapon.Mace]: { path: "mace.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.Morningstar]: { path: "morning-star.glb", artist: Artist.SystemG6 }, // https://opengameart.org/content/medieval-weapon-pack
  [OneHandedMeleeWeapon.WarHammer]: { path: "war-hammer.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.ButterKnife]: { path: "butter-knife.glb", artist: Artist.P0ss }, // https://opengameart.org/content/cutlery-pack
  [OneHandedMeleeWeapon.ShortSword]: { path: "short-sword.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.Blade]: { path: "blade.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.BroadSword]: { path: "broad-sword.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.BastardSword]: { path: "bastard-sword.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.Dagger]: { path: "dagger.glb", artist: Artist.Drummyfish }, // drummyfish
  [OneHandedMeleeWeapon.Rapier]: { path: "rapier.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.ShortSpear]: { path: "short-spear.glb", artist: Artist.Quaternius }, // quaternius
  [OneHandedMeleeWeapon.RuneSword]: { path: "rune-sword.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.EtherBlade]: { path: "ether-blade.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-swords-asset-2
  [OneHandedMeleeWeapon.IceBlade]: { path: "ice-blade.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [OneHandedMeleeWeapon.MapleWand]: { path: "maple-wand.glb", artist: Artist.SystemG6 }, // https://opengameart.org/content/medieval-weapon-pack
  [OneHandedMeleeWeapon.WillowWand]: { path: "willow-wand.glb", artist: Artist.Snowden }, // self made
  [OneHandedMeleeWeapon.YewWand]: { path: "yew-wand.glb", artist: Artist.WeaponGuy }, // https://opengameart.org/content/basic-wand
  [OneHandedMeleeWeapon.RoseWand]: { path: "rose-wand.glb", artist: Artist.Snowden },
};

export const TWO_HANDED_MELEE_WEAPON_MODELS: Record<
  TwoHandedMeleeWeapon,
  { path: null | string; artist: Artist }
> = {
  // [TwoHandedMeleeWeapon.BoStaff]: "bardiche.glb",
  [TwoHandedMeleeWeapon.RottingBranch]: { path: "rotting-branch.glb", artist: Artist.Quaternius }, // https://quaternius.com/packs/stylizednaturemegakit.html
  [TwoHandedMeleeWeapon.BoStaff]: { path: "elemental-staff.glb", artist: Artist.ClintBellanger }, // https://opengameart.org/content/kingdom-weapon-set
  [TwoHandedMeleeWeapon.Spear]: { path: "spear.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [TwoHandedMeleeWeapon.Bardiche]: { path: "bardiche.glb", artist: Artist.ClintBellanger }, // https://opengameart.org/content/kingdom-weapon-set
  [TwoHandedMeleeWeapon.SplittingMaul]: { path: "splitting-maul.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-axes-pack
  [TwoHandedMeleeWeapon.Maul]: { path: "maul.glb", artist: Artist.SystemG6 }, // https://opengameart.org/content/medieval-weapon-pack
  [TwoHandedMeleeWeapon.BattleAxe]: { path: "battle-axe.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-axes-pack
  [TwoHandedMeleeWeapon.Glaive]: { path: "glaive.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [TwoHandedMeleeWeapon.ElementalStaff]: {
    path: "elemental-staff.glb",
    artist: Artist.ClintBellanger,
  }, // https://opengameart.org/content/kingdom-weapon-set
  [TwoHandedMeleeWeapon.Trident]: { path: "trident.glb", artist: Artist.JoneyLol }, // https://poly.pizza/m/Z5URRESKKt
  [TwoHandedMeleeWeapon.GreatAxe]: { path: "great-axe.glb", artist: Artist.ProxyGames }, // https://opengameart.org/content/low-poly-axes-pack
  [TwoHandedMeleeWeapon.GravityHammer]: { path: "gravity-hammer.glb", artist: Artist.Mehrasaur }, // https://opengameart.org/content/3d-hammer-pack
  [TwoHandedMeleeWeapon.ElmStaff]: { path: "elm-staff.glb", artist: Artist.SystemG6 }, // https://opengameart.org/content/medieval-weapon-pack
  [TwoHandedMeleeWeapon.MahoganyStaff]: { path: "mahogany-staff.glb", artist: Artist.Zsky }, // https://opengameart.org/content/weapons-pack-0
  [TwoHandedMeleeWeapon.EbonyStaff]: { path: "ebony-staff.glb", artist: Artist.Mastahcez }, // https://opengameart.org/content/stylised-fantasy-weapons
};

export const TWO_HANDED_RANGED_WEAPON_MODELS: Record<
  TwoHandedRangedWeapon,
  { path: null | string; artist: Artist }
> = {
  // [TwoHandedRangedWeapon.ShortBow]: "composite-bow.glb",
  [TwoHandedRangedWeapon.ShortBow]: { path: "short-bow.glb", artist: Artist.Zsky }, // zsky
  [TwoHandedRangedWeapon.RecurveBow]: { path: "recurve-bow.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [TwoHandedRangedWeapon.CompositeBow]: { path: "composite-bow.glb", artist: Artist.Quaternius }, // quaternius
  [TwoHandedRangedWeapon.MilitaryBow]: { path: "military-bow.glb", artist: Artist.Quaternius }, // quaternius
  [TwoHandedRangedWeapon.EtherBow]: { path: "ether-bow.glb", artist: Artist.Zsky }, // zsky
};

export const SHIELD_MODELS: Record<Shield, { path: null | string; artist: Artist }> = {
  // [Shield.MakeshiftBuckler]: "wooden-kite-shield.glb",
  [Shield.PotLid]: { path: "pot-lid.glb", artist: Artist.P0ss },
  [Shield.MakeshiftBuckler]: { path: "makeshift-buckler.glb", artist: Artist.Djonvincent }, // https://opengameart.org/content/trap-door
  [Shield.Heater]: { path: "wooden-kite-shield.glb", artist: Artist.Quaternius }, // quaternius
  [Shield.Buckler]: { path: "buckler.glb", artist: Artist.RyanHetchler }, // https://opengameart.org/content/19-low-poly-fantasy-weapons
  [Shield.Pavise]: { path: "pavise.glb", artist: Artist.Snowden }, // self-made
  [Shield.Aspis]: { path: "aspis.glb", artist: Artist.Mastahcez }, // https://opengameart.org/content/stylised-fantasy-weapons
  [Shield.LanternShield]: { path: "lantern-shield.glb", artist: Artist.ClintBellanger }, // https://opengameart.org/content/skeleton-warrior-0
  [Shield.KiteShield]: { path: "kite-shield.glb", artist: Artist.SystemG6 }, // https://opengameart.org/content/medieval-weapon-pack
  [Shield.TowerShield]: { path: "tower-shield.glb", artist: Artist.Quaternius }, // quaternius
  [Shield.AncientBuckler]: { path: "ancient-buckler.glb", artist: Artist.ClintBellanger }, // https://opengameart.org/content/iron-buckler
  [Shield.GothicShield]: { path: "gothic-shield.glb", artist: Artist.SystemG6 }, // https://opengameart.org/content/medieval-weapon-pack
};
