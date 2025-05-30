import {
  Equipment,
  EquipmentType,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
} from "../equipment/index.js";

export enum CraftingAction {
  Repair, // Restore item to full durability
  Imbue, // give a non magical item randomized affix(es) (POE Equivalent: Alchemy Orb / Transmutation Orb)
  Augment, // add an affix if the item has only 1 affix (POE Equivalent: Orb of Augmentation / Exalted Orb)
  Tumble, // give a magical item new random affixes and values (POE Equivalent: Orb of Alteration / Chaos Orb)
  Reform, // reroll implicit item values (example: base armor class) (POE Equivalent: Blessed Orb)
  Shake, // reroll existing affix values (but keep the same affixes) (POE Equivalent: Divine Orb)
}

export const CRAFTING_ACTION_DESCRIPTIONS: Record<CraftingAction, string> = {
  [CraftingAction.Repair]: "Restore item to full durability",
  [CraftingAction.Imbue]: "Give a non-magical item randomized affix(es)",
  [CraftingAction.Augment]: "Add a second affix to an item which only has a single affix",
  [CraftingAction.Tumble]: "Give a magical item new random affixes",
  [CraftingAction.Reform]:
    "Reroll an item's implicit properties (armor class, damage classification)",
  [CraftingAction.Shake]: "Reroll the values of existing affixes",
};

export const CRAFTING_ACTION_STRINGS: Record<CraftingAction, string> = {
  [CraftingAction.Repair]: "Repair",
  [CraftingAction.Imbue]: "Imbue",
  [CraftingAction.Augment]: "Augment",
  [CraftingAction.Tumble]: "Tumble",
  [CraftingAction.Reform]: "Reform",
  [CraftingAction.Shake]: "Shake",
};

export const CRAFTING_ACTION_PAST_TENSE_STRINGS: Record<CraftingAction, string> = {
  [CraftingAction.Repair]: "Repaired",
  [CraftingAction.Imbue]: "Imbued",
  [CraftingAction.Augment]: "Augmented",
  [CraftingAction.Tumble]: "Tumbled",
  [CraftingAction.Reform]: "Reformed",
  [CraftingAction.Shake]: "Shook",
};

export const CRAFTING_ACTION_DISABLED_CONDITIONS: Record<
  CraftingAction,
  (equipment: Equipment, itemLevelLimiter: number) => boolean
> = {
  [CraftingAction.Repair]: function (equipment: Equipment): boolean {
    const durability = Equipment.getDurability(equipment);
    return durability === null || durability.current === durability.max;
  },
  [CraftingAction.Imbue]: function (equipment: Equipment): boolean {
    return Equipment.isMagical(equipment);
  },
  [CraftingAction.Augment]: function (equipment: Equipment): boolean {
    return (
      !Equipment.isMagical(equipment) ||
      (Equipment.hasPrefix(equipment) && Equipment.hasSuffix(equipment))
    );
  },
  [CraftingAction.Tumble]: function (equipment: Equipment): boolean {
    return !Equipment.isMagical(equipment);
  },
  [CraftingAction.Reform]: function (equipment: Equipment): boolean {
    const { taggedBaseEquipment } = equipment.equipmentBaseItemProperties;
    switch (taggedBaseEquipment.equipmentType) {
      case EquipmentType.Ring:
      case EquipmentType.Amulet:
      case EquipmentType.TwoHandedRangedWeapon:
        return true;
      case EquipmentType.OneHandedMeleeWeapon:
        if (taggedBaseEquipment.baseItemType === OneHandedMeleeWeapon.RuneSword) return false;
        else return true;
      case EquipmentType.TwoHandedMeleeWeapon:
        if (taggedBaseEquipment.baseItemType === TwoHandedMeleeWeapon.ElementalStaff) return false;
        else return true;
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Shield:
        return false;
    }
  },
  [CraftingAction.Shake]: function (equipment: Equipment, itemLevelLimiter: number): boolean {
    // since this rolls within the values on the existing affixs' tiers, don't allow
    // if at a vending machine that is not on a floor at least as deep as the item level
    return !Equipment.isMagical(equipment) || equipment.itemLevel > itemLevelLimiter;
  },
};
