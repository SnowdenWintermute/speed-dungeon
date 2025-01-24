import {
  HpChangeSource,
  HpChangeSourceCategory,
  KineticDamageType,
} from "../../../combat/index.js";
import { EntityProperties, NumberRange } from "../../../primatives/index.js";
import { OneHandedMeleeWeapon } from "../equipment-types/one-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../equipment-types/two-handed-ranged-weapon.js";
import { Equipment, EquipmentType } from "../index.js";

export enum PreDeterminedItemType {
  SkeletonArcherShortBow,
  AnimalClaw,
  Fist,
  Spike,
}

export function generatePreDeterminedItem(itemType: PreDeterminedItemType, id: string) {
  const entityProperties: EntityProperties = { name: "", id };

  switch (itemType) {
    case PreDeterminedItemType.SkeletonArcherShortBow:
      entityProperties.name = "Skeleton Archer's Bow";
      return new Equipment(
        entityProperties,
        1,
        {},
        {
          taggedBaseEquipment: {
            equipmentType: EquipmentType.TwoHandedRangedWeapon,
            baseItemType: TwoHandedRangedWeapon.ShortBow,
          },
          equipmentType: EquipmentType.TwoHandedRangedWeapon,
          damage: new NumberRange(1, 2),
          damageClassification: [
            new HpChangeSource({
              category: HpChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Piercing,
            }),
          ],
        },
        null
      );
    case PreDeterminedItemType.AnimalClaw:
      entityProperties.name = "Animal Claw";
      return new Equipment(
        entityProperties,
        1,
        {},
        {
          taggedBaseEquipment: {
            equipmentType: EquipmentType.OneHandedMeleeWeapon,
            baseItemType: OneHandedMeleeWeapon.ShortSword,
          },
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          damage: new NumberRange(1, 2),
          damageClassification: [
            new HpChangeSource({
              category: HpChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Slashing,
            }),
          ],
        },
        null
      );
    case PreDeterminedItemType.Fist:
      entityProperties.name = "Fist";
      return new Equipment(
        entityProperties,
        1,
        {},
        {
          taggedBaseEquipment: {
            equipmentType: EquipmentType.OneHandedMeleeWeapon,
            baseItemType: OneHandedMeleeWeapon.Stick,
          },
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          damage: new NumberRange(1, 2),
          damageClassification: [
            new HpChangeSource({
              category: HpChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Blunt,
            }),
          ],
        },
        null
      );
    case PreDeterminedItemType.Spike:
      entityProperties.name = "Spike";
      return new Equipment(
        entityProperties,
        1,
        {},
        {
          taggedBaseEquipment: {
            equipmentType: EquipmentType.OneHandedMeleeWeapon,
            baseItemType: OneHandedMeleeWeapon.Dagger,
          },
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          damage: new NumberRange(1, 2),
          damageClassification: [
            new HpChangeSource({
              category: HpChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Blunt,
            }),
          ],
        },
        null
      );
  }
}
