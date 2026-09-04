import { makeAutoObservable, observable, runInAction } from "mobx";
import { COMBATANT_MAX_LEVEL, CombatantClass, CombatAttribute } from "@speed-dungeon/common";
import { CharacterBuildSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import {
  AttainableAttributeCalculator,
  AttainableAttributeSpecification,
  ScoredEquipmentSets,
} from "../attribute-viewer/attainable-attribute-calculator.ts";
import {
  isStoredEnumMember,
  isStoredRecord,
  PersistedAttainableAttributesTabState,
  readStoredNumber,
} from "./persisted-ui-state.ts";

const DEFAULT_SPECIFICATION: AttainableAttributeSpecification = {
  attribute: CombatAttribute.Speed,
  buildSpec: {
    mainClass: CombatantClass.Rogue,
    supportClass: CombatantClass.Warrior,
    weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
  },
  level: COMBATANT_MAX_LEVEL,
};

// what the shown numbers came from, which is the specification as it was when calculate was
// pressed rather than whatever is dialed in now
interface Calculation {
  specification: AttainableAttributeSpecification;
  scoredSets: ScoredEquipmentSets;
}

export class AttainableAttributesTabState {
  specification = DEFAULT_SPECIFICATION;
  calculation: null | Calculation = null;
  isCalculating = false;

  constructor() {
    makeAutoObservable(this, {
      // the calculator reads the specification while fitting every set, and a scored set holds
      // every collection it fitted: neither is worth proxying, and both are only replaced whole
      specification: observable.ref,
      calculation: observable.ref,
    });
  }

  setSpecification(specification: AttainableAttributeSpecification) {
    this.specification = specification;
  }

  setAttribute(attribute: CombatAttribute) {
    this.specification = { ...this.specification, attribute };
  }

  setBuildSpec(buildSpec: CharacterBuildSpecification) {
    this.specification = { ...this.specification, buildSpec };
  }

  // a character supports itself with any class but the one it already mains, so taking a new main
  // class has to give up a support selection that just became the same class
  setMainClass(mainClass: CombatantClass) {
    const { buildSpec } = this.specification;
    this.setBuildSpec({
      ...buildSpec,
      mainClass,
      supportClass: buildSpec.supportClass === mainClass ? null : buildSpec.supportClass,
    });
  }

  calculate() {
    this.isCalculating = true;
    const { specification } = this;

    // fitting every set blocks, so it is queued behind the render that puts the spinner up rather
    // than done in the handler, where the spinner would never paint
    setTimeout(() => {
      const scoredSets = new AttainableAttributeCalculator().getScoredEquipmentSets(specification);
      runInAction(() => {
        this.calculation = { specification, scoredSets };
        this.isCalculating = false;
      });
    }, 0);
  }

  toSerialized(): PersistedAttainableAttributesTabState {
    return { specification: this.specification };
  }

  applySerialized(stored: unknown) {
    if (!isStoredRecord(stored)) {
      return;
    }
    const specification = readStoredSpecification(stored.specification);
    if (specification !== undefined) {
      this.specification = specification;
    }
  }
}

/** a partly readable specification is discarded rather than half applied: a build spec is only
 * meaningful whole, and a mismatched pair would silently score something never selected */
function readStoredSpecification(stored: unknown): undefined | AttainableAttributeSpecification {
  if (!isStoredRecord(stored)) {
    return undefined;
  }
  const { attribute, buildSpec, level } = stored;
  const readLevel = readStoredNumber(level);

  if (!isStoredEnumMember<CombatAttribute>(CombatAttribute, attribute) || readLevel === undefined) {
    return undefined;
  }
  const readBuildSpec = readStoredBuildSpec(buildSpec);
  if (readBuildSpec === undefined) {
    return undefined;
  }

  return { attribute, buildSpec: readBuildSpec, level: readLevel };
}

function readStoredBuildSpec(stored: unknown): undefined | CharacterBuildSpecification {
  if (!isStoredRecord(stored)) {
    return undefined;
  }
  const { weaponSpecialty, mainClass, supportClass } = stored;

  if (
    !isStoredEnumMember<CharacterWeaponSpecialty>(CharacterWeaponSpecialty, weaponSpecialty) ||
    !isStoredEnumMember<CombatantClass>(CombatantClass, mainClass) ||
    !(supportClass === null || isStoredEnumMember<CombatantClass>(CombatantClass, supportClass))
  ) {
    return undefined;
  }

  return { weaponSpecialty, mainClass, supportClass };
}
