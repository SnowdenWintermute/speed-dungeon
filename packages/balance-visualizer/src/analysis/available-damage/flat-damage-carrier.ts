import {
  AffixCategory,
  AffixType,
  Amulet,
  EntityName,
  Equipment,
  EquipmentSlotType,
  EquipmentTraitType,
  EquipmentType,
  IdGenerator,
  invariant,
  WearableSlotType,
} from "@speed-dungeon/common";

const NO_ITEM_LEVEL = 1;
const LOWEST_TIER = 1;

/** For "allocating" average available flat damage from non-weapon equipment. A stand-in
 * average for any real equipment a user might find with +Damage */
export class FlatDamageCarrier {
  private readonly equipment: Equipment;

  constructor(idGenerator: IdGenerator) {
    this.equipment = new Equipment(
      { id: idGenerator.generate(), name: "pool flat damage" as EntityName },
      NO_ITEM_LEVEL,
      {},
      { equipmentType: EquipmentType.Amulet, baseItemType: Amulet.Amulet },
      null
    );

    this.equipment.affixes = {
      [AffixCategory.Suffix]: {
        [AffixType.FlatDamage]: {
          combatAttributes: {},
          equipmentTraits: {
            [EquipmentTraitType.FlatDamageAdditive]: {
              equipmentTraitType: EquipmentTraitType.FlatDamageAdditive,
              value: 0,
            },
          },
          tier: LOWEST_TIER,
        },
      },
    };
  }

  static readonly SLOT = {
    type: EquipmentSlotType.Wearable as const,
    slot: WearableSlotType.Amulet,
  };

  getEquipment() {
    return this.equipment;
  }

  setFlatDamage(value: number) {
    const trait =
      this.equipment.affixes[AffixCategory.Suffix]?.[AffixType.FlatDamage]?.equipmentTraits[
        EquipmentTraitType.FlatDamageAdditive
      ];
    invariant(trait !== undefined, "the carrier lost the suffix it exists to carry");
    trait.value = value;
  }
}
