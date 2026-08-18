import {
  compareStringsOrdinally,
  Equipment,
  EquipmentSlotType,
  invariant,
  iterateNumericEnum,
  MapUtils,
} from "@speed-dungeon/common";

type EquipmentScoreAxisIndex = number;
interface EquipmentAxisScore {
  equipment: Equipment;
  score: number;
}

export class EquipmentScoreDominationSolver {
  constructor(
    private partySlotCapacities: Record<EquipmentSlotType, number>,
    private equipmentScoreAxisCheckers: ((equipment: Equipment) => number)[]
  ) {}

  private getCapacityForCompatibleSlotTypes(equipment: Equipment) {
    const { compatibleSlotTypes } = equipment.getCompatibleSlots();

    let capacity = 0;
    for (const slotType of compatibleSlotTypes) {
      capacity += this.partySlotCapacities[slotType];
    }

    return capacity;
  }

  private axisScoreIsPositive(score: number) {
    return score > 0;
  }

  private collectSortedPositiveScoresByAxis(considered: Equipment[]) {
    const scoresByAxisIndex = new Map<EquipmentScoreAxisIndex, EquipmentAxisScore[]>();

    for (const equipment of considered) {
      this.equipmentScoreAxisCheckers.forEach((axisScoreChecker, scoreCheckerIndex) => {
        const score = axisScoreChecker(equipment);

        if (!this.axisScoreIsPositive(score)) {
          return;
        }

        const record = scoresByAxisIndex.get(scoreCheckerIndex) ?? [];
        record.push({ equipment, score });
        scoresByAxisIndex.set(scoreCheckerIndex, record);
      });
    }

    for (const scores of scoresByAxisIndex.values()) {
      scores.sort((a, b) => {
        const primary = b.score - a.score;
        if (primary !== 0) {
          return primary;
        }
        return compareStringsOrdinally(b.equipment.getEntityId(), a.equipment.getEntityId());
      });
    }

    return scoresByAxisIndex;
  }

  private collectPositiveScoresByEquipment(considered: Equipment[]) {
    const positiveScoresByEquipment = new Map<Equipment, Map<EquipmentScoreAxisIndex, number>>();

    for (const equipment of considered) {
      this.equipmentScoreAxisCheckers.forEach((axisScoreChecker, scoreCheckerIndex) => {
        const score = axisScoreChecker(equipment);

        if (!this.axisScoreIsPositive(score)) {
          return;
        }

        const scoresByEquipmentRecord = positiveScoresByEquipment.get(equipment) ?? new Map();
        scoresByEquipmentRecord.set(scoreCheckerIndex, score);
        positiveScoresByEquipment.set(equipment, scoresByEquipmentRecord);
      });
    }

    return positiveScoresByEquipment;
  }

  // a onehander that is dominated in the mainhand slot may be still worth considering
  // in the offhand slot
  private getEquipmentDominatedInAllCompatibleSlots(
    unusedEquipmentBySlotType: Map<EquipmentSlotType, Set<Equipment>>
  ) {
    const unusedEquipmentInAtLeastOneSlot = new Set<Equipment>();
    for (const [_slotType, equipmentSet] of unusedEquipmentBySlotType) {
      for (const equipment of equipmentSet) {
        unusedEquipmentInAtLeastOneSlot.add(equipment);
      }
    }

    const unusedEquipment = new Set<Equipment>();
    for (const equipment of unusedEquipmentInAtLeastOneSlot) {
      const { compatibleSlotTypes } = equipment.getCompatibleSlots();

      // check if it is considered unused in all its slots
      let isDominatedInAllCompatibleSlots = true;
      for (const slotType of compatibleSlotTypes) {
        const isDominatedInThisSlotType = unusedEquipmentBySlotType.get(slotType)?.has(equipment);
        if (!isDominatedInThisSlotType) {
          isDominatedInAllCompatibleSlots = false;
          break;
        }
      }

      if (isDominatedInAllCompatibleSlots) {
        unusedEquipment.add(equipment);
      }
    }

    return unusedEquipment;
  }

  private getRanksByAxisIndex(
    scoresByAxisIndex: Map<EquipmentScoreAxisIndex, EquipmentAxisScore[]>
  ) {
    const rankByEquipmentByAxisIndex = new Map<EquipmentScoreAxisIndex, Map<Equipment, number>>();
    for (const [axisIndex, axisRankings] of scoresByAxisIndex) {
      const rankByEquipment = new Map<Equipment, number>();
      axisRankings.forEach(({ equipment }, rank) => {
        rankByEquipment.set(equipment, rank);
      });
      rankByEquipmentByAxisIndex.set(axisIndex, rankByEquipment);
    }

    return rankByEquipmentByAxisIndex;
  }

  // if exists seven +2 dex rings and one +1 dex ring, no one will want that +1 dex ring
  getCapacityDominatedEquipment(equipmentBySlotType: Record<EquipmentSlotType, Equipment[]>) {
    const partySlotCapacities = this.partySlotCapacities;
    const unusedEquipmentBySlotType = new Map<EquipmentSlotType, Set<Equipment>>();

    for (const slotType of iterateNumericEnum(EquipmentSlotType)) {
      const compatibleItems = equipmentBySlotType[slotType];
      const unusedInThisSlotType = new Set<Equipment>();

      // An equipment may not be in the top capacity list for either score but it may be just below
      // the threshold on multiple capacities, so we can't discount it like a ring that gives
      // +2 str +2 dex competing against six +3 dex and six +3 str rings when the party slot capacity
      // for rings is 6. Only discount it if it has a score on only one axis, and is not within the total
      // capacity across slot types for that equipment type.
      //
      // In party of three, one-handed weapons can go in both main and offhand, so the slot capacity
      // is six, even though the slot types are different.
      const positiveScoresByEquipment = this.collectPositiveScoresByEquipment(compatibleItems);
      const scoresByAxisIndex = this.collectSortedPositiveScoresByAxis(compatibleItems);
      const rankByEquipmentByAxisIndex = this.getRanksByAxisIndex(scoresByAxisIndex);

      for (const equipment of compatibleItems) {
        const scores = positiveScoresByEquipment.get(equipment);
        const hasNoPositiveScore = !scores;

        if (hasNoPositiveScore) {
          unusedInThisSlotType.add(equipment);
          continue;
        }

        const isOnMultipleScoreLists = scores.size >= 2;
        if (isOnMultipleScoreLists) {
          continue;
        }

        const onlyAxisIndexScored = MapUtils.getFirstEntry(scores)?.[0];
        invariant(
          onlyAxisIndexScored !== undefined,
          "expected to have recorded a score on a single axis"
        );

        const rankByEquipment = rankByEquipmentByAxisIndex.get(onlyAxisIndexScored);
        invariant(rankByEquipment !== undefined, "expected to be scored on an existing list");
        const rank = rankByEquipment.get(equipment);
        invariant(rank !== undefined, "expected a positively scored equipment to be ranked");

        if (rank >= this.getCapacityForCompatibleSlotTypes(equipment)) {
          unusedInThisSlotType.add(equipment);
        }
      }

      unusedEquipmentBySlotType.set(slotType, unusedInThisSlotType);
    }

    return this.getEquipmentDominatedInAllCompatibleSlots(unusedEquipmentBySlotType);
  }
}
