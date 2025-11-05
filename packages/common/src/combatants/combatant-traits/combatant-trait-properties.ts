import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import { Percentage } from "../../primatives/index.js";
import { makeAutoObservable } from "mobx";
import { CombatantTraitType } from "./trait-types.js";
import { runIfInBrowser } from "../../utils/index.js";

export class CombatantTraitProperties {
  inherentElementalAffinities: Partial<Record<MagicalElement, Percentage>> = {};
  inherentKineticDamageTypeAffinities: Partial<Record<KineticDamageType, Percentage>> = {};
  inherentTraitLevels: Partial<Record<CombatantTraitType, number>> = {};
  speccedTraitLevels: Partial<Record<CombatantTraitType, number>> = {};

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }
}
