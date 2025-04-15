import { ResourceChangeSource, ResourceChangeSourceModifiers } from "../../hp-change-source-types.js";

export function copySelectedModifiersFromResourceChangeSource(
  to: ResourceChangeSource,
  from: ResourceChangeSource,
  modifiers: Set<ResourceChangeSourceModifiers>
) {
  for (const modifier of modifiers) {
    MODIFIER_COPYING_FUNCTIONS[modifier](to, from);
  }
}

const MODIFIER_COPYING_FUNCTIONS: Record<
  ResourceChangeSourceModifiers,
  (to: ResourceChangeSource, from: ResourceChangeSource) => void
> = {
  [ResourceChangeSourceModifiers.KineticType]: function (to: ResourceChangeSource, from: ResourceChangeSource): void {
    to.kineticDamageTypeOption = from.kineticDamageTypeOption;
  },
  [ResourceChangeSourceModifiers.MagicalElement]: function (
    to: ResourceChangeSource,
    from: ResourceChangeSource
  ): void {
    to.elementOption = from.elementOption;
  },
  [ResourceChangeSourceModifiers.SourceCategory]: function (
    to: ResourceChangeSource,
    from: ResourceChangeSource
  ): void {
    to.category = from.category;
  },
  [ResourceChangeSourceModifiers.Lifesteal]: function (to: ResourceChangeSource, from: ResourceChangeSource): void {
    if (from.lifestealPercentage)
      to.lifestealPercentage
        ? (to.lifestealPercentage += from.lifestealPercentage)
        : (to.lifestealPercentage = from.lifestealPercentage);
  },
};
