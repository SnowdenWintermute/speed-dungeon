import {
  ClassProgressionProperties,
  CombatantBuilder,
  CombatAttribute,
  IdGeneratorRandom,
  invariant,
  Username,
} from "@speed-dungeon/common";
import { CharacterBuildSpecification } from "../analysis-subjects/analysis-character-specification";
import { BestPossibleEquipmentCollection } from "./best-possible-equipment-collection";
import { ScoredEquipmentSet, ThresholdEquipmentSetScores } from "./threshold-equipment-set-scores";

export interface AttainableAttributeSpecification {
  attribute: CombatAttribute;
  buildSpec: CharacterBuildSpecification;
  level: number;
}

export interface ScoredEquipmentSets {
  /** the answer to what a build can attain; a caller sweeping builds reads only this */
  best: ScoredEquipmentSet;
  sortedByScore: ScoredEquipmentSet[];
}

const ANALYSIS_CHARACTER_NAME = "attainable attribute subject" as Username;

export class AttainableAttributeCalculator {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private equipmentCollection = new BestPossibleEquipmentCollection();

  private buildCombatant(specification: AttainableAttributeSpecification) {
    const { level, buildSpec } = specification;

    const combatantBuilder = CombatantBuilder.playerCharacter(
      buildSpec.mainClass,
      ANALYSIS_CHARACTER_NAME
    ).level(level);

    if (buildSpec.supportClass !== null) {
      combatantBuilder.supportClass(
        buildSpec.supportClass,
        ClassProgressionProperties.maxSupportClassLevel(level)
      );
    }

    const combatant = combatantBuilder.build(this.idGenerator);

    // levels handed out by the builder never ran a levelup, so the points one would have awarded
    // have to be granted here or nothing can be spent on requirements
    const { attributeProperties, classProgressionProperties } = combatant.combatantProperties;
    attributeProperties.resetAllocations(
      classProgressionProperties.getAttributePointsAwardedForLevels()
    );

    return combatant;
  }

  getScoredEquipmentSets(specification: AttainableAttributeSpecification): ScoredEquipmentSets {
    const { attribute, buildSpec } = specification;

    const combatant = this.buildCombatant(specification);

    const equipmentList =
      this.equipmentCollection.buildEquipmentOptionsForCombatantChasingAttribute(
        combatant,
        attribute
      );

    const sortedByScore = new ThresholdEquipmentSetScores(
      combatant,
      attribute,
      buildSpec.weaponSpecialty,
      equipmentList
    )
      .getScoredSets()
      .sort((a, b) => b.score - a.score);

    const [best] = sortedByScore;
    invariant(
      best !== undefined,
      "leaving every slot empty is always one of the sets, so there is always a best"
    );

    return { best, sortedByScore };
  }
}
