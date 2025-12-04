import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import { Percentage } from "../../primatives/index.js";
import { makeAutoObservable } from "mobx";
import { CombatantTraitType } from "./trait-types.js";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../../utils/index.js";
import { plainToInstance } from "class-transformer";

export class CombatantTraitProperties {
  inherentElementalAffinities: Partial<Record<MagicalElement, Percentage>> = {};
  inherentKineticDamageTypeAffinities: Partial<Record<KineticDamageType, Percentage>> = {};
  inherentTraitLevels: Partial<Record<CombatantTraitType, number>> = {};
  speccedTraitLevels: Partial<Record<CombatantTraitType, number>> = {};

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(plain: CombatantTraitProperties) {
    return plainToInstance(CombatantTraitProperties, plain);
  }

  hasTraitType(traitType: CombatantTraitType) {
    return (
      this.inherentTraitLevels[traitType] !== undefined ||
      this.speccedTraitLevels[traitType] !== undefined
    );
  }

  iterateAllTraits() {
    return [
      ...iterateNumericEnumKeyedRecord(this.inherentTraitLevels),
      iterateNumericEnumKeyedRecord(this.speccedTraitLevels),
    ];
  }
}
