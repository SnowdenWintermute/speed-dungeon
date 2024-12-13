import {
  AffixType,
  EquipmentTraitType,
  Item,
  ItemPropertiesType,
  PrefixType,
} from "../../index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { HpChangeSource } from "../../../combat/index.js";

export function applyEquipmentTraitsToHpChangeSource(item: Item, hpChangeSource: HpChangeSource) {
  if (item.itemProperties.type === ItemPropertiesType.Consumable)
    return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

  const lifestealAffixOption =
    item.itemProperties.equipmentProperties.affixes[AffixType.Prefix][PrefixType.LifeSteal];
  if (lifestealAffixOption) {
    const lifestealPercentageTrait =
      lifestealAffixOption.equipmentTraits[EquipmentTraitType.LifeSteal];
    if (!lifestealPercentageTrait)
      return new Error(ERROR_MESSAGES.EQUIPMENT.EXPECTED_TRAIT_MISSING);

    hpChangeSource.lifestealPercentage
      ? (hpChangeSource.lifestealPercentage += lifestealPercentageTrait.value)
      : (hpChangeSource.lifestealPercentage = lifestealPercentageTrait.value);
  }
}
