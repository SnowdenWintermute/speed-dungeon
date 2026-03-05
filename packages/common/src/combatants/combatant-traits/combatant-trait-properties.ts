import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import { Percentage } from "../../aliases.js";
import { makeAutoObservable } from "mobx";
import { CombatantTraitType } from "./trait-types.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";

export class CombatantTraitProperties implements Serializable, ReactiveNode {
  inherentElementalAffinities: Partial<Record<MagicalElement, Percentage>> = {};
  inherentKineticDamageTypeAffinities: Partial<Record<KineticDamageType, Percentage>> = {};
  inherentTraitLevels: Partial<Record<CombatantTraitType, number>> = {};
  speccedTraitLevels: Partial<Record<CombatantTraitType, number>> = {};

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<CombatantTraitProperties>) {
    return plainToInstance(CombatantTraitProperties, serialized);
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
