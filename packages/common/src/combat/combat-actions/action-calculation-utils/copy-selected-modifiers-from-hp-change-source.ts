import { HpChangeSource, HpChangeSourceModifiers } from "../../hp-change-source-types.js";

export function copySelectedModifiersFromHpChangeSource(
  to: HpChangeSource,
  from: HpChangeSource,
  modifiers: Set<HpChangeSourceModifiers>
) {
  for (const modifier of modifiers) {
    MODIFIER_COPYING_FUNCTIONS[modifier](to, from);
  }
}

const MODIFIER_COPYING_FUNCTIONS: Record<
  HpChangeSourceModifiers,
  (to: HpChangeSource, from: HpChangeSource) => void
> = {
  [HpChangeSourceModifiers.KineticType]: function (to: HpChangeSource, from: HpChangeSource): void {
    to.kineticDamageTypeOption = from.kineticDamageTypeOption;
  },
  [HpChangeSourceModifiers.MagicalElement]: function (
    to: HpChangeSource,
    from: HpChangeSource
  ): void {
    to.elementOption = from.elementOption;
  },
  [HpChangeSourceModifiers.SourceCategory]: function (
    to: HpChangeSource,
    from: HpChangeSource
  ): void {
    to.category = from.category;
  },
  [HpChangeSourceModifiers.Lifesteal]: function (to: HpChangeSource, from: HpChangeSource): void {
    if (from.lifestealPercentage)
      to.lifestealPercentage
        ? (to.lifestealPercentage += from.lifestealPercentage)
        : (to.lifestealPercentage = from.lifestealPercentage);
  },
};
