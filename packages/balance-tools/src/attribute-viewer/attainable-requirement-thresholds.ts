import { Combatant } from "@speed-dungeon/common";
import { AttributeRequirementThreshold } from "./attribute-requirement-threshold";
import { RequirementThresholdSetEquipmentSlotCandidateRankings } from "./requirement-threshold-set-equipment-slot-candidate-rankings";

export class AttainableRequirementThresholds {
  constructor(
    private combatant: Combatant,
    private rankings: RequirementThresholdSetEquipmentSlotCandidateRankings
  ) {}

  // every wearable outfit needs the highest requirement of each attribute across its pieces, and
  // that combination is usually printed on no single item. joining slot by slot builds them all,
  // and since joining only ever raises a requirement, one too expensive can be dropped on the spot
  generate() {
    const { attributeProperties } = this.combatant.combatantProperties;
    const attributesBeforeAllocation = attributeProperties.getTotalAttributes();
    const pointsAvailable = attributeProperties.getUnspentPoints();

    let thresholdsByKey = new Map<string, AttributeRequirementThreshold>();
    const empty = new AttributeRequirementThreshold();
    thresholdsByKey.set(empty.getKey(), empty);

    for (const slotId of this.rankings.getRankedSlotIds()) {
      const joinedByKey = new Map<string, AttributeRequirementThreshold>();

      for (const threshold of thresholdsByKey.values()) {
        for (const slotRequirements of this.rankings.getDistinctRequirements(slotId)) {
          const joined = threshold.joinedWith(slotRequirements);
          if (joined.pointsToReach(attributesBeforeAllocation) > pointsAvailable) {
            continue;
          }
          joinedByKey.set(joined.getKey(), joined);
        }
      }

      thresholdsByKey = joinedByKey;
    }

    return [...thresholdsByKey.values()];
  }
}
