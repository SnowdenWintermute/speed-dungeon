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

// the specification as it was when calculate was pressed, not whatever is dialed in now
interface Calculation {
  specification: AttainableAttributeSpecification;
  scoredSets: ScoredEquipmentSets;
}

export class AttainableAttributesTabState {
  specification = DEFAULT_SPECIFICATION;
  calculation: null | Calculation = null;
  isCalculating = false;
  failureReason: null | string = null;

  constructor() {
    makeAutoObservable(this, {
      // the calculator reads the specification while fitting every set, and a scored set holds
      // every collection it fitted: neither is worth proxying, and both are only replaced whole
      specification: observable.ref,
      calculation: observable.ref,
    });
  }

  setAttribute(attribute: CombatAttribute) {
    this.specification = { ...this.specification, attribute };
  }

  setBuildSpec(buildSpec: CharacterBuildSpecification) {
    this.specification = { ...this.specification, buildSpec };
  }

  // a character supports itself with any class but the one it already mains
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
    this.failureReason = null;
    const { specification } = this;

    // fitting every set blocks, so it is queued behind the render that puts the spinner up
    setTimeout(() => {
      let calculation: null | Calculation = null;
      let failureReason: null | string = null;
      try {
        const scoredSets = new AttainableAttributeCalculator().getScoredEquipmentSets(specification);
        calculation = { specification, scoredSets };
      } catch (probablyError) {
        failureReason = probablyError instanceof Error ? probablyError.message : String(probablyError);
      }

      runInAction(() => {
        // a fit that threw leaves the last numbers standing rather than blanking the table
        if (calculation !== null) {
          this.calculation = calculation;
        }
        this.failureReason = failureReason;
        // every control on the tab is disabled while this is set
        this.isCalculating = false;
      });
    }, 0);
  }

  toSerialized(): PersistedAttainableAttributesTabState {
    const { attribute, buildSpec } = this.specification;

    return { attribute, buildSpec };
  }

  applySerialized(stored: unknown) {
    if (!isStoredRecord(stored)) {
      return;
    }
    const specification = readStoredSpecification(stored);
    if (specification !== undefined) {
      this.specification = specification;
    }
  }
}

/** a build spec is only meaningful whole, so a mismatched pair would silently score something
 * never selected */
function readStoredSpecification(
  stored: Record<string, unknown>
): undefined | AttainableAttributeSpecification {
  const { attribute, buildSpec } = stored;
  if (!isStoredEnumMember<CombatAttribute>(CombatAttribute, attribute)) {
    return undefined;
  }
  const readBuildSpec = readStoredBuildSpec(buildSpec);
  if (readBuildSpec === undefined) {
    return undefined;
  }

  return { attribute, buildSpec: readBuildSpec, level: DEFAULT_SPECIFICATION.level };
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
