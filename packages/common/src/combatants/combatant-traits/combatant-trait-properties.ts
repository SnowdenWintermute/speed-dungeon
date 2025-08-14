import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import { Percentage } from "../../primatives/index.js";
import { CombatantTraitType } from "./index.js";

export class CombatantTraitProperties {
  inherentElementalAffinities: Partial<Record<MagicalElement, Percentage>> = {};
  inherentKineticDamageTypeAffinities: Partial<Record<KineticDamageType, Percentage>> = {};
  inherentTraits: Partial<Record<CombatantTraitType, number>> = {};
  speccedTraits: Partial<Record<CombatantTraitType, number>> = {};
}

// TraitDescriptions: Record<TraitType, () => string[]
