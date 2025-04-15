import { ERROR_MESSAGES } from "../../../errors/index.js";
import { ResourceChangeSource } from "../../../combat/index.js";
import { AffixType, PrefixType } from "../affixes.js";
import { Equipment, EquipmentTraitType } from "../index.js";

export function applyEquipmentTraitsToResourceChangeSource(
  equipment: Equipment,
  hpChangeSource: ResourceChangeSource
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
