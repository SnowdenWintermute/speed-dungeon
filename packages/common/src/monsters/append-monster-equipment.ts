import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { TwoHandedMeleeWeapon } from "../items/equipment/equipment-types/two-handed-melee-weapon.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { MonsterType } from "./monster-types.js";

export function appendMonsterEquipment(
  builder: CombatantBuilder,
  monsterType: MonsterType,
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder,
  rng: RandomNumberGenerator
): void {
  switch (monsterType) {
    case MonsterType.FireMage: {
      const staffOptions = [
        TwoHandedMeleeWeapon.MahoganyStaff,
        TwoHandedMeleeWeapon.ElmStaff,
        TwoHandedMeleeWeapon.EbonyStaff,
        TwoHandedMeleeWeapon.ElementalStaff,
        TwoHandedMeleeWeapon.BoStaff,
      ];
      let staffType = ArrayUtils.chooseRandom(staffOptions, rng);
      if (staffType instanceof Error) staffType = TwoHandedMeleeWeapon.BoStaff;

      builder.equipMainHand(
        itemBuilder
          .twoHandedMeleeWeapon(staffType)
          .randomizeAffixes()
          .randomizeBaseProperties()
          .randomizeDurability()
          .build(idGenerator)
      );
      break;
    }
    case MonsterType.Cultist: {
      builder.equipMainHand(
        itemBuilder
          .oneHandedMeleeWeapon(OneHandedMeleeWeapon.Blade)
          .randomizeAffixes()
          .randomizeBaseProperties()
          .randomizeDurability()
          .build(idGenerator)
      );
      break;
    }
    case MonsterType.Wolf:
    case MonsterType.MantaRay:
    case MonsterType.Net:
    case MonsterType.Spider:
      break;
  }
}
