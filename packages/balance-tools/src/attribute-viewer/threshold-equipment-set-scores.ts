import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  COMBAT_ATTRIBUTES,
  Combatant,
  CombatAttribute,
  Equipment,
  EquipmentBaseItem,
  EQUIPMENT_SLOT_ID_STRINGS,
  EquipmentSlotId,
  EquipmentType,
  invariant,
  iterateNumericEnumKeyedRecord,
  MapUtils,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty";
import { BestImprovementAttributeAllocation } from "../solvers/best-improvement-attribute-allocation";
import { AttainableRequirementThresholds } from "./attainable-requirement-thresholds";
import { AttributeRequirementThreshold } from "./attribute-requirement-threshold";
import { ChasedAttributeMeter } from "./chased-attribute-meter";
import { RequirementThresholdSetEquipmentSlotCandidateRankings } from "./requirement-threshold-set-equipment-slot-candidate-rankings";

export interface ScoredEquipmentSet {
  requirements: AttributeRequirementThreshold;
  set: Partial<Record<EquipmentSlotId, Equipment>>;
  score: number;
}

interface CapturedAllocations {
  allocated: Record<CombatAttribute, number>;
  unspentPoints: number;
}

export class ThresholdEquipmentSetScores {
  private meter: ChasedAttributeMeter;
  private rankings: RequirementThresholdSetEquipmentSlotCandidateRankings;

  constructor(
    private combatant: Combatant,
    chasedAttribute: CombatAttribute,
    specialty: CharacterWeaponSpecialty,
    equipmentByType: Map<EquipmentType, Map<EquipmentBaseItem, Equipment>>
  ) {
    this.meter = new ChasedAttributeMeter(combatant, chasedAttribute);
    this.rankings = new RequirementThresholdSetEquipmentSlotCandidateRankings(
      this.meter,
      specialty,
      equipmentByType
    );
  }

  private selectSet(threshold: AttributeRequirementThreshold) {
    const set: Partial<Record<EquipmentSlotId, Equipment>> = {};

    for (const slotId of this.rankings.getRankedSlotIds()) {
      const bestOption = this.rankings.getBestCoveredBy(slotId, threshold);
      if (bestOption === undefined) {
        continue;
      }
      set[slotId] = bestOption;
    }

    return set;
  }

  private getSetKey(set: Partial<Record<EquipmentSlotId, Equipment>>) {
    return iterateNumericEnumKeyedRecord(set)
      .map(([slotId, equipment]) => `${slotId}:${equipment.getEntityId()}`)
      .join("|");
  }

  // what the outfit actually costs, which is never more than the threshold that found it: a
  // threshold admits every item below it, and the pieces picked may all sit well under the ceiling
  private getSetRequirements(set: Partial<Record<EquipmentSlotId, Equipment>>) {
    let requirements = new AttributeRequirementThreshold();

    for (const [_slotId, equipment] of iterateNumericEnumKeyedRecord(set)) {
      requirements = requirements.joinedWith(
        new AttributeRequirementThreshold(equipment.requirements)
      );
    }

    return requirements;
  }

  private allocateToMeet(requirements: AttributeRequirementThreshold) {
    const { attributeProperties } = this.combatant.combatantProperties;

    for (const [attribute, required] of iterateNumericEnumKeyedRecord(
      requirements.getMinimums()
    )) {
      // re-read rather than snapshot: closing one requirement can raise a derived attribute that
      // another requirement asks for
      const current = attributeProperties.getTotalAttributes()[attribute];
      if (current >= required) {
        continue;
      }

      // a requirement on a derived attribute cannot be bought directly, and speccing one anyway
      // would report a set as attainable that no player could ever put together
      attributeProperties.requireAttributeAllocatable(attribute);

      const needed = required - current;
      invariant(
        needed <= attributeProperties.getUnspentPoints(),
        "every generated threshold was checked against the point budget before it got here"
      );

      const allocated = attributeProperties.getAllocatedAttributes()[attribute];
      attributeProperties.changeUnspentPoints(-needed);
      attributeProperties.setSpeccedAttributeValue(attribute, allocated + needed);
    }
  }

  // nothing is off limits here, the study asks what is attainable at all. an attribute no
  // allocation can reach, like armor class, simply finds no improvement and keeps its points
  private allocateRemainingTowardChasedAttribute() {
    const { attributeProperties } = this.combatant.combatantProperties;

    BestImprovementAttributeAllocation.allocate(
      this.combatant,
      ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
      attributeProperties.getUnspentPoints(),
      () => this.meter.getValue()
    );
  }

  // both allocations happen with the set already worn, so the leftover points are spent against the
  // attributes the outfit actually produces rather than against a naked character's
  private wearAndAllocate(
    set: Partial<Record<EquipmentSlotId, Equipment>>,
    requirements: AttributeRequirementThreshold
  ) {
    return this.meter.wearing(set, () => {
      this.allocateToMeet(requirements);
      this.allocateRemainingTowardChasedAttribute();

      return this.meter.getValue();
    });
  }

  private captureAllocations(): CapturedAllocations {
    const { attributeProperties } = this.combatant.combatantProperties;
    return {
      allocated: attributeProperties.getAllocatedAttributes(),
      unspentPoints: attributeProperties.getUnspentPoints(),
    };
  }

  private restoreAllocations(captured: CapturedAllocations) {
    const { attributeProperties } = this.combatant.combatantProperties;
    attributeProperties.resetAllocations(captured.unspentPoints);
    for (const attribute of COMBAT_ATTRIBUTES) {
      attributeProperties.setSpeccedAttributeValue(attribute, captured.allocated[attribute]);
    }
  }

  private logSelectionVariety(
    thresholdCount: number,
    scoredSets: ScoredEquipmentSet[]
  ) {
    const selectedNamesBySlot = new Map<EquipmentSlotId, Set<string>>();

    for (const { set } of scoredSets) {
      for (const [slotId, equipment] of iterateNumericEnumKeyedRecord(set)) {
        const names = MapUtils.getOrCreate(selectedNamesBySlot, slotId, () => new Set<string>());
        names.add(equipment.entityProperties.name);
      }
    }

    console.log(`thresholds: ${thresholdCount}, distinct sets: ${scoredSets.length}`);
    for (const [slotId, names] of selectedNamesBySlot) {
      console.log(
        `  ${EQUIPMENT_SLOT_ID_STRINGS[slotId]}: ${names.size} ever selected [${[...names].join(", ")}]`
      );
    }
  }

  getScoredSets(): ScoredEquipmentSet[] {
    const thresholds = new AttainableRequirementThresholds(
      this.combatant,
      this.rankings
    ).generate();

    const allocationsBeforeScoring = this.captureAllocations();
    const scoredBySetKey = new Map<string, ScoredEquipmentSet>();

    for (const threshold of thresholds) {
      const set = this.selectSet(threshold);
      const setKey = this.getSetKey(set);
      if (scoredBySetKey.has(setKey)) {
        continue;
      }

      const requirements = this.getSetRequirements(set);
      const score = this.wearAndAllocate(set, requirements);
      scoredBySetKey.set(setKey, { requirements, set, score });

      this.restoreAllocations(allocationsBeforeScoring);
    }

    const scoredSets = [...scoredBySetKey.values()];
    this.logSelectionVariety(thresholds.length, scoredSets);

    return scoredSets;
  }
}
