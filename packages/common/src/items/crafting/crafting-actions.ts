export enum CraftingAction {
  Scrape, // remove all affixes (POE Equivalent: Scouring Orb)
  Imbue, // give a non magical item randomized affix(es) (POE Equivalent: Alchemy Orb / Transmutation Orb)
  Augment, // add an affix if the item has only 1 affix (POE Equivalent: Orb of Augmentation / Exalted Orb)
  Tumble, // reroll affixes on a magical item (give new random affixes and values) (POE Equivalent: Orb of Alteration / Chaos Orb)
  Reform, // reroll implicit item values (example: base armor class) (POE Equivalent: Blessed Orb)
  Shake, // reroll existing affix values (but keep the same affixes) (POE Equivalent: Divine Orb)
}
