import { ERROR_MESSAGES } from "../../../errors/index.js";
import { HpChangeSource } from "../../../combat/index.js";
import { AffixType, PrefixType } from "../affixes.js";
import { Equipment, EquipmentTraitType } from "../index.js";

export function applyEquipmentTraitsToHpChangeSource(
  equipment: Equipment,
  hpChangeSource: HpChangeSource
) {
  const lifestealAffixOption = equipment.affixes[AffixType.Prefix][PrefixType.LifeSteal];

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
