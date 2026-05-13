import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../combat/hp-change-source-types.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { TwoHandedMeleeWeapon } from "../items/equipment/equipment-types/two-handed-melee-weapon.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { NumberRange } from "../primatives/number-range.js";
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
    case MonsterType.Wolf: {
      const clawsBuilder = itemBuilder
        .oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSpear)
        .indestructible();
      const mainhandClaw = clawsBuilder.build(idGenerator);
      mainhandClaw.requireWeaponProperties().damage = new NumberRange(2, 4);
      mainhandClaw.requirements = {};
      const offhandClaw = clawsBuilder.build(idGenerator);
      offhandClaw.requireWeaponProperties().damage = new NumberRange(2, 4);
      offhandClaw.requirements = {};

      builder.equipMainHand(mainhandClaw);
      builder.equipOffHand(offhandClaw);
      break;
    }
    case MonsterType.MantaRay:
      {
        const clawsBuilder = itemBuilder
          .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.Spear)
          .indestructible();
        const mainhandClaw = clawsBuilder.build(idGenerator);
        mainhandClaw.requirements = {};
        mainhandClaw.requireWeaponProperties().damage = new NumberRange(2, 8);
        mainhandClaw.requireWeaponProperties().damageClassification = [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Piercing,
            elementOption: MagicalElement.Water,
          }),
        ];

        builder.equipMainHand(mainhandClaw);
      }
      break;
    case MonsterType.Spider: {
      const clawsBuilder = itemBuilder
        .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.Spear)
        .indestructible();
      const mainhandClaw = clawsBuilder.build(idGenerator);
      mainhandClaw.requireWeaponProperties().damage = new NumberRange(2, 8);
      mainhandClaw.requireWeaponProperties().damageClassification = [
        new ResourceChangeSource({
          category: ResourceChangeSourceCategory.Physical,
          kineticDamageTypeOption: KineticDamageType.Piercing,
          elementOption: MagicalElement.Dark,
        }),
      ];
      mainhandClaw.requirements = {};

      builder.equipMainHand(mainhandClaw);
      break;
    }
    case MonsterType.Net:
      break;
  }
}
