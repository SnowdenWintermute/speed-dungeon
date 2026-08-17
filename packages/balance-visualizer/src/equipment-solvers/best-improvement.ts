import {
  AdventuringParty,
  ArrayUtils,
  BasicRandomNumberGenerator,
  COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE,
  Equipment,
  EquipmentSlotType,
  iterateNumericEnum,
  SLOT_TYPE_BY_SLOT_ID,
} from "@speed-dungeon/common";

type EquipmentScoreAxisIndex = number;

export class BestImprovementEquipmentSolver {
  unusedEquipment: Equipment[] = [];
  filteredConsiderable: Equipment[] = [];

  constructor(
    private party: AdventuringParty,
    private equipmentScoreAxisCheckers: ((equipment: Equipment) => number)[]
  ) {}

  private dropAllCharacterItemsOnGround() {
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      combatant.getEquipmentOption().unequipAll();
      combatant.requireInventory().dropAll(this.party);
    }
  }

  private getPartySlotEquipmentCapacities() {
    const totals: Record<EquipmentSlotType, number> = {
      [EquipmentSlotType.Head]: 0,
      [EquipmentSlotType.Body]: 0,
      [EquipmentSlotType.Finger]: 0,
      [EquipmentSlotType.Neck]: 0,
      [EquipmentSlotType.MainHand]: 0,
      [EquipmentSlotType.OffHand]: 0,
    };

    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      for (const [_slotId, slot] of combatant.combatantProperties.equipment.getAllActiveSlots()) {
        const total = totals[slot.type];

        if (total !== undefined) {
          totals[slot.type] = total + 1;
        } else {
          totals[slot.type] = 1;
        }
      }
    }

    return totals;
  }

  private getPartyEquipmentBySlotType() {
    const equipmentBySlotType: Record<EquipmentSlotType, Equipment[]> = {
      [EquipmentSlotType.Head]: [],
      [EquipmentSlotType.Body]: [],
      [EquipmentSlotType.Finger]: [],
      [EquipmentSlotType.Neck]: [],
      [EquipmentSlotType.MainHand]: [],
      [EquipmentSlotType.OffHand]: [],
    };

    for (const equipment of this.party.currentRoom.inventory.equipment) {
      const slotIds =
        COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE[equipment.equipmentBaseItemProperties.equipmentType];
      const slotTypes: EquipmentSlotType[] = [];
      for (const slotId of Object.values(slotIds)) {
        const slotType = SLOT_TYPE_BY_SLOT_ID[slotId];
        if (!slotTypes.includes(slotType)) {
          equipmentBySlotType[slotType].push(equipment);
        }
        slotTypes.push(slotType);
      }
    }

    return equipmentBySlotType;
  }

  private collectSortedScoresByAxis(considered: Equipment[]) {
    const scoresByAxisIndex = new Map<
      EquipmentScoreAxisIndex,
      { equipment: Equipment; score: number }[]
    >();

    for (const equipment of considered) {
      this.equipmentScoreAxisCheckers.forEach((axisScoreChecker, scoreCheckerIndex) => {
        const score = axisScoreChecker(equipment);

        const record = scoresByAxisIndex.get(scoreCheckerIndex) ?? [];
        record.push({ equipment, score });
        scoresByAxisIndex.set(scoreCheckerIndex, record);
      });
    }

    for (const [scoreAxisIndex, scores] of scoresByAxisIndex) {
      scores.sort((a, b) => b.score - a.score);
    }

    return scoresByAxisIndex;
  }

  private collectPositiveScoresByEquipment(considered: Equipment[]) {
    const positiveScoresByEquipment = new Map<Equipment, Map<EquipmentScoreAxisIndex, number>>();

    for (const equipment of considered) {
      this.equipmentScoreAxisCheckers.forEach((axisScoreChecker, scoreCheckerIndex) => {
        const score = axisScoreChecker(equipment);

        if (score <= 0) {
          return;
        }

        const scoresByEquipmentRecord = positiveScoresByEquipment.get(equipment) ?? new Map();
        scoresByEquipmentRecord.set(scoreCheckerIndex, score);
        positiveScoresByEquipment.set(equipment, scoresByEquipmentRecord);
      });
    }

    return positiveScoresByEquipment;
  }

  // if exists seven +2 dex rings and one +1 dex ring, no one will want that +1 dex ring
  private filterSingleAxisCapacityDominated() {
    const partySlotCapacities = this.getPartySlotEquipmentCapacities();
    const equipmentBySlotType = this.getPartyEquipmentBySlotType();
    const unusedEquipment = new Set<Equipment>();

    for (const slotType of iterateNumericEnum(EquipmentSlotType)) {
      const partySlotCapacity = partySlotCapacities[slotType];
      const compatibleItems = equipmentBySlotType[slotType];

      if (compatibleItems.length <= partySlotCapacity) {
        continue;
      }

      // An equipment may not be in the top capacity list for either score but it may be just below
      // the threshold on multiple capacities, so we can't discount it like a ring that gives
      // +2 str +2 dex competing against six +3 dex and six +3 str rings when the party slot capacity
      // for rings is 6. Only discount it if it has a score on only one axis, and is not in the capacity
      // top list for that axis.
      const positiveScoresByEquipment = this.collectPositiveScoresByEquipment(compatibleItems);
      const scoresByAxisIndex = this.collectSortedScoresByAxis(compatibleItems);

      for (const [equipment, scores] of positiveScoresByEquipment) {
        if (scores.size === 0) {
          unusedEquipment.add(equipment);
        }

        const isOnMultipleScoreLists = scores.size >= 2;
        if (isOnMultipleScoreLists) {
          continue;
        }

        // find which axis list it is on (should be only 1)
        // check if it is within the slot capacity ranking
        // if not, add to unused equipment
      }
    }
  }

  solve() {
    const unusedEquipment = this.filterSingleAxisCapacityDominated();

    // - sort equipment slots in random order
    const shuffledSlotTypes = ArrayUtils.shuffle(
      iterateNumericEnum(EquipmentSlotType),
      new BasicRandomNumberGenerator()
    );

    const itemsBySlot = this.getPartyEquipmentBySlotType();
    const assignedEquipment = new Set<Equipment>();

    // - for each slot
    for (const slotType of shuffledSlotTypes) {
      //   - for each item that fills that slot
      const compatibleItems = itemsBySlot[slotType];
      //     - for each party member
      for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
        //
        //       - measure current goal performance
        //         - for auto-attack damage this is "average damage on target dummy sampled over x attacks"
        //         - for basic spirit users this is "total spirit"
        //       - try on the item
        //       - record how much the goal performance increased
      }
      //     - give the item to character who's goal performance increased the most
      //     - record that item as "tested: assigned to character x, with new GoalPerformanceScore"
      //     - if the item displaced a previously tested item
      //       - place it back in the pool for re-testing
      //     - after all items in this slot tested, check displaced items
      //       - each item should have a GoalPerformanceScore change for each character that didn't initially get the item
      //       - any item they actually did get should also have a GoalPerformanceScore
      //       - assign the displaced item to the character it would increase GoalPerformanceScore the most for
      //         - if it displaces their item, put that item back in the re-check pool
      //         - if no character wants it, put it in the UnusedEquipment pile
      // - return the UnusedEquipment pile to the caller for sharding or exclusion from future testing
    }
  }
}
