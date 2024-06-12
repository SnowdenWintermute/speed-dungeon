import { EquipmentProperties, EquipmentType, Item, ItemPropertiesType } from "../..";
import {
  HpChangeSource,
  HpChangeSourceCategoryType,
  MeleeOrRanged,
  PhysicalDamageType,
} from "../../../combat";
import { IdGenerator } from "../../../game/id_generator";
import { EntityProperties } from "../../../primatives";
import { OneHandedMeleeWeapon } from "../equipment-types/one-handed-melee-weapon";
import { TwoHandedRangedWeapon } from "../equipment-types/two-handed-ranged-weapon";

export enum PreDeterminedItemType {
  SkeletonArcherShortBow,
  AnimalClaw,
  Fist,
  Spike,
}

export function generatePreDeterminedItem(
  itemType: PreDeterminedItemType,
  idGenerator: IdGenerator
) {
  const entityProperties: EntityProperties = { name: "", id: idGenerator.getNextEntityId() };

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
            TwoHandedRangedWeapon.ShortBow,
            {
              type: EquipmentType.TwoHandedRangedWeapon,
              damage: { min: 1, max: 4 },
              damageClassification: [
                new HpChangeSource(
                  {
                    type: HpChangeSourceCategoryType.PhysicalDamage,
                    meleeOrRanged: MeleeOrRanged.Ranged,
                  },
                  PhysicalDamageType.Piercing
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
            OneHandedMeleeWeapon.Dagger,
            {
              type: EquipmentType.OneHandedMeleeWeapon,
              damage: { min: 1, max: 4 },
              damageClassification: [
                new HpChangeSource(
                  {
                    type: HpChangeSourceCategoryType.PhysicalDamage,
                    meleeOrRanged: MeleeOrRanged.Melee,
                  },
                  PhysicalDamageType.Slashing
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
            OneHandedMeleeWeapon.Stick,
            {
              type: EquipmentType.OneHandedMeleeWeapon,
              damage: { min: 1, max: 1 },
              damageClassification: [
                new HpChangeSource(
                  {
                    type: HpChangeSourceCategoryType.PhysicalDamage,
                    meleeOrRanged: MeleeOrRanged.Melee,
                  },
                  PhysicalDamageType.Blunt
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
            OneHandedMeleeWeapon.Dagger,
            {
              type: EquipmentType.OneHandedMeleeWeapon,
              damage: { min: 1, max: 4 },
              damageClassification: [
                new HpChangeSource(
                  {
                    type: HpChangeSourceCategoryType.PhysicalDamage,
                    meleeOrRanged: MeleeOrRanged.Melee,
                  },
                  PhysicalDamageType.Piercing
                ),
              ],
            },
            null
          ),
        }
      );
  }
}
