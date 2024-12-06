import {
  AffixType,
  ArmorCategory,
  BodyArmor,
  EquipmentProperties,
  EquipmentType,
  Item,
  ItemPropertiesType,
  SuffixType,
} from "../../index.js";
import {
  HpChangeSource,
  HpChangeSourceCategory,
  KineticDamageType,
  MeleeOrRanged,
} from "../../../combat/index.js";
import { EntityProperties, MaxAndCurrent } from "../../../primatives/index.js";
import { OneHandedMeleeWeapon } from "../equipment-types/one-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../equipment-types/two-handed-ranged-weapon.js";
import { CombatAttribute } from "../../../combatants/combat-attributes.js";

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
      return new Item(
        entityProperties,
        1,
        {},
        {
          type: ItemPropertiesType.Equipment,
          equipmentProperties: new EquipmentProperties(
            {
              type: EquipmentType.TwoHandedRangedWeapon,
              baseItem: TwoHandedRangedWeapon.ShortBow,
              damage: { min: 1, max: 4 },
              damageClassification: [
                new HpChangeSource(
                  HpChangeSourceCategory.Physical,
                  MeleeOrRanged.Ranged,
                  false,
                  KineticDamageType.Piercing
                ),
              ],
            },
            null
          ),
        }
      );
    case PreDeterminedItemType.AnimalClaw:
      entityProperties.name = "Animal Claw";
      return new Item(
        entityProperties,
        1,
        {},
        {
          type: ItemPropertiesType.Equipment,
          equipmentProperties: new EquipmentProperties(
            {
              type: EquipmentType.OneHandedMeleeWeapon,
              baseItem: OneHandedMeleeWeapon.ShortSword,
              damage: { min: 1, max: 4 },
              damageClassification: [
                new HpChangeSource(
                  HpChangeSourceCategory.Physical,
                  MeleeOrRanged.Melee,
                  false,
                  KineticDamageType.Slashing
                ),
              ],
            },
            null
          ),
        }
      );
    case PreDeterminedItemType.Fist:
      entityProperties.name = "Fist";
      return new Item(
        entityProperties,
        1,
        {},
        {
          type: ItemPropertiesType.Equipment,
          equipmentProperties: new EquipmentProperties(
            {
              type: EquipmentType.OneHandedMeleeWeapon,
              baseItem: OneHandedMeleeWeapon.Stick,
              damage: { min: 1, max: 1 },
              damageClassification: [
                new HpChangeSource(
                  HpChangeSourceCategory.Physical,
                  MeleeOrRanged.Melee,
                  false,
                  KineticDamageType.Blunt
                ),
              ],
            },
            null
          ),
        }
      );
    case PreDeterminedItemType.Spike:
      entityProperties.name = "Spike";
      return new Item(
        entityProperties,
        1,
        {},
        {
          type: ItemPropertiesType.Equipment,
          equipmentProperties: new EquipmentProperties(
            {
              type: EquipmentType.OneHandedMeleeWeapon,
              baseItem: OneHandedMeleeWeapon.Dagger,
              damage: { min: 1, max: 4 },
              damageClassification: [
                new HpChangeSource(
                  HpChangeSourceCategory.Physical,
                  MeleeOrRanged.Melee,
                  false,
                  KineticDamageType.Piercing
                ),
              ],
            },
            null
          ),
        }
      );
  }
}
