import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../combat/hp-change-source-types.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import {
  Equipment,
  EquipmentType,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
} from "../items/equipment/index.js";
import { HoldableSlotType } from "../items/equipment/slots.js";
import { NumberRange } from "../primatives/number-range.js";
import { MonsterType } from "./monster-types.js";

export const MONSTER_UNARMED_WEAPONS: Record<
  MonsterType,
  null | Partial<Record<HoldableSlotType, Equipment>>
> = {
  [MonsterType.MetallicGolem]: null,
  [MonsterType.Wolf]: {
    [HoldableSlotType.MainHand]: new Equipment(
      {
        id: "wolf default main hand weapon id",
        name: "wolf default main hand weapon",
      },
      1,
      {},
      {
        equipmentType: EquipmentType.OneHandedMeleeWeapon,
        taggedBaseEquipment: {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.ShortSpear,
        },
        damage: new NumberRange(2, 4),
        damageClassification: [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Piercing,
          }),
        ],
      },
      null
    ),
    [HoldableSlotType.OffHand]: new Equipment(
      {
        id: "wolf default off hand weapon id",
        name: "wolf default off hand weapon",
      },
      1,
      {},
      {
        equipmentType: EquipmentType.OneHandedMeleeWeapon,
        taggedBaseEquipment: {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.ShortSpear,
        },
        damage: new NumberRange(2, 4),
        damageClassification: [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Piercing,
          }),
        ],
      },
      null
    ),
  },
  [MonsterType.Zombie]: null,
  [MonsterType.SkeletonArcher]: null,
  [MonsterType.Scavenger]: null,
  [MonsterType.Vulture]: null,
  [MonsterType.FireMage]: null,
  [MonsterType.FireElemental]: null,
  [MonsterType.IceElemental]: null,
  [MonsterType.Cultist]: null,
  [MonsterType.MantaRay]: {
    [HoldableSlotType.MainHand]: new Equipment(
      {
        id: "manta ray default main hand weapon id",
        name: "manta ray default main hand weapon",
      },
      1,
      {},
      {
        equipmentType: EquipmentType.TwoHandedMeleeWeapon,
        taggedBaseEquipment: {
          equipmentType: EquipmentType.TwoHandedMeleeWeapon,
          baseItemType: TwoHandedMeleeWeapon.Spear,
        },
        damage: new NumberRange(2, 8),
        damageClassification: [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Piercing,
            elementOption: MagicalElement.Water,
          }),
        ],
      },
      null
    ),
  },
  [MonsterType.Net]: null,
};
