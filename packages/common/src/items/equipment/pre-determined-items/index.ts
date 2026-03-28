import { EntityName } from "../../../aliases.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../../../combat/hp-change-source-types.js";
import { KineticDamageType } from "../../../combat/kinetic-damage-types.js";
import { EntityProperties } from "../../../primatives/entity-properties.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { EquipmentType } from "../equipment-types/index.js";
import { OneHandedMeleeWeapon } from "../equipment-types/one-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../equipment-types/two-handed-ranged-weapon.js";
import { Equipment } from "../index.js";

export enum PreDeterminedItemType {
  SkeletonArcherShortBow,
  AnimalClaw,
  Fist,
  Spike,
}

export function generatePreDeterminedItem(itemType: PreDeterminedItemType, id: string) {
  const entityProperties: EntityProperties = { name: "" as EntityName, id };

  switch (itemType) {
    case PreDeterminedItemType.SkeletonArcherShortBow:
      entityProperties.name = "Skeleton Archer's Bow" as EntityName;
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
            new ResourceChangeSource({
              category: ResourceChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Piercing,
            }),
          ],
        },
        null
      );
    case PreDeterminedItemType.AnimalClaw:
      entityProperties.name = "Animal Claw" as EntityName;
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
            new ResourceChangeSource({
              category: ResourceChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Slashing,
            }),
          ],
        },
        null
      );
    case PreDeterminedItemType.Fist:
      entityProperties.name = "Fist" as EntityName;
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
            new ResourceChangeSource({
              category: ResourceChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Blunt,
            }),
          ],
        },
        null
      );
    case PreDeterminedItemType.Spike:
      entityProperties.name = "Spike" as EntityName;
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
            new ResourceChangeSource({
              category: ResourceChangeSourceCategory.Physical,
              kineticDamageTypeOption: KineticDamageType.Blunt,
            }),
          ],
        },
        null
      );
  }
}
