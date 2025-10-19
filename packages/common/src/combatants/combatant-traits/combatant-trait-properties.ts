import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import { Percentage } from "../../primatives/index.js";
import { CombatantTraitType } from "./index.js";
import { makeAutoObservable } from "mobx";

export class CombatantTraitProperties {
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }
  inherentElementalAffinities: Partial<Record<MagicalElement, Percentage>> = {};
  inherentKineticDamageTypeAffinities: Partial<Record<KineticDamageType, Percentage>> = {};
  inherentTraitLevels: Partial<Record<CombatantTraitType, number>> = {};
  speccedTraitLevels: Partial<Record<CombatantTraitType, number>> = {};
}
