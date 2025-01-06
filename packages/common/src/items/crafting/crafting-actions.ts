export enum CraftingAction {
  Repair, // restore item durability to maximum
  Imbue, // give a non magical item randomized affix(es) (POE Equivalent: Alchemy Orb / Transmutation Orb)
  Augment, // add an affix if the item has only 1 affix (POE Equivalent: Orb of Augmentation / Exalted Orb)
  Tumble, // give a magical item new random affixes and values (POE Equivalent: Orb of Alteration / Chaos Orb)
  Reform, // reroll implicit item values (example: base armor class) (POE Equivalent: Blessed Orb)
  Shake, // reroll existing affix values (but keep the same affixes) (POE Equivalent: Divine Orb)
}

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
