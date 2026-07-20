import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../combat/hp-change-source-types.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { Shield } from "../items/equipment/equipment-types/shield.js";
import { TwoHandedMeleeWeapon } from "../items/equipment/equipment-types/two-handed-melee-weapon.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { NumberRange } from "../primatives/number-range.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { invariant } from "../utils/index.js";
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
      mainhandClaw.requireWeaponProperties().damage = new NumberRange(1, 3);
      mainhandClaw.requirements = {};
      const offhandClaw = clawsBuilder.build(idGenerator);
      offhandClaw.requireWeaponProperties().damage = new NumberRange(1, 3);
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
    case MonsterType.Slime: {
      const clawsBuilder = itemBuilder
        .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.Maul)
        .indestructible();
      const mainhandClaw = clawsBuilder.build(idGenerator);
      mainhandClaw.requireWeaponProperties().damage = new NumberRange(1, 2);
      mainhandClaw.requireWeaponProperties().damageClassification = [
        new ResourceChangeSource({
          category: ResourceChangeSourceCategory.Physical,
          kineticDamageTypeOption: KineticDamageType.Blunt,
        }),
      ];
      mainhandClaw.requirements = {};

      builder.equipMainHand(mainhandClaw);
      break;
    }
    case MonsterType.Zombie: {
      const clawsBuilder = itemBuilder
        .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.Maul)
        .indestructible();
      const mainhandClaw = clawsBuilder.build(idGenerator);
      mainhandClaw.requireWeaponProperties().damage = new NumberRange(4, 6);
      mainhandClaw.requireWeaponProperties().damageClassification = [
        new ResourceChangeSource({
          category: ResourceChangeSourceCategory.Physical,
          kineticDamageTypeOption: KineticDamageType.Blunt,
        }),
      ];
      mainhandClaw.requirements = {};

      builder.equipMainHand(mainhandClaw);
      break;
    }
    case MonsterType.SkeletonWarrior: {
      const mainHandWeaponBuilder = itemBuilder
        .oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword)
        .indestructible();
      const mainhandWeapon = mainHandWeaponBuilder.build(idGenerator);
      mainhandWeapon.requirements = {};
      mainhandWeapon.requireWeaponProperties().damage = new NumberRange(1, 4);
      const offhandEquipmentBuilder = itemBuilder
        .shield(Shield.Heater)
        .indestructible()
        .armorClass(0);
      const offhandEquipment = offhandEquipmentBuilder.build(idGenerator);
      offhandEquipment.requirements = {};

      builder.equipMainHand(mainhandWeapon);
      builder.equipOffHand(offhandEquipment);
      break;
    }
    case MonsterType.SkeletonCaptain: {
      const equipmentChoices = [
        OneHandedMeleeWeapon.IceBlade,
        OneHandedMeleeWeapon.Mace,
        OneHandedMeleeWeapon.Blade,
      ];
      const weaponType = ArrayUtils.chooseRandom(equipmentChoices, rng);
      invariant(!(weaponType instanceof Error));
      const mainHandWeaponBuilder = itemBuilder.oneHandedMeleeWeapon(weaponType).indestructible();
      const mainhandWeapon = mainHandWeaponBuilder.build(idGenerator);
      mainhandWeapon.requirements = {};
      // mainhandWeapon.requireWeaponProperties().damage = new NumberRange(1, 4);
      const offhandEquipmentBuilder = itemBuilder
        .shield(Shield.KiteShield)
        .indestructible()
        .armorClass(0);
      const offhandEquipment = offhandEquipmentBuilder.build(idGenerator);
      offhandEquipment.requirements = {};

      builder.equipMainHand(mainhandWeapon);
      builder.equipOffHand(offhandEquipment);
      break;
    }
    case MonsterType.VampireBat: {
      const mainHandWeaponBuilder = itemBuilder
        .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.Spear)
        .indestructible();
      const mainhandWeapon = mainHandWeaponBuilder.build(idGenerator);
      mainhandWeapon.requirements = {};
      mainhandWeapon.requireWeaponProperties().damage = new NumberRange(0, 3);

      builder.equipMainHand(mainhandWeapon);
      break;
    }
    case MonsterType.TyrantRex: {
      const mainHandWeaponBuilder = itemBuilder
        .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.Spear)
        .indestructible();
      const mainhandWeapon = mainHandWeaponBuilder.build(idGenerator);
      mainhandWeapon.requirements = {};
      mainhandWeapon.requireWeaponProperties().damage = new NumberRange(10, 16);

      builder.equipMainHand(mainhandWeapon);
      break;
    }
    case MonsterType.Net:
      break;
  }
}
