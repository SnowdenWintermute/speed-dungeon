import {
  AdventuringParty,
  ALTERNATE_SLOT_IDS,
  ArrayUtils,
  BasicRandomNumberGenerator,
  Combatant,
  CombatantId,
  Equipment,
  EquipmentSlotId,
  EquipmentSlotType,
  iterateNumericEnum,
  MapUtils,
} from "@speed-dungeon/common";
import { EquipmentScoreDominationSolver } from "./equipment-score-domination";

export class BestImprovementEquipmentSolver {
  private scoreDominationSolver: EquipmentScoreDominationSolver;

  constructor(
    private party: AdventuringParty,
    //  - measure current goal performance
    //    - for auto-attack damage this is "average damage on target dummy sampled over x attacks"
    //    - for basic spirit users this is "total spirit"
    private getGoalPerformance: (combatant: Combatant) => number,
    equipmentScoreAxisCheckers: ((equipment: Equipment) => number)[]
  ) {
    this.scoreDominationSolver = new EquipmentScoreDominationSolver(
      BestImprovementEquipmentSolver.getCombatantGroupEquipmentCapacities(
        party.combatantManager.getPartyMemberCharacters()
      ),
      equipmentScoreAxisCheckers
    );
  }

  private dropAllCharacterItemsOnGround() {
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      combatant.getEquipmentOption().unequipAll();
      combatant.requireInventory().dropAll(this.party);
    }
  }

  private getPartyEquipmentByCompatibleSlotIds() {
    const equipmentBySlotIds: Record<EquipmentSlotId, Set<Equipment>> = {
      [EquipmentSlotId.Head]: new Set(),
      [EquipmentSlotId.Body]: new Set(),
      [EquipmentSlotId.FingerMain]: new Set(),
      [EquipmentSlotId.FingerAlternate]: new Set(),
      [EquipmentSlotId.Neck]: new Set(),
      [EquipmentSlotId.MainHand]: new Set(),
      [EquipmentSlotId.OffHand]: new Set(),
    };

    for (const equipment of this.party.currentRoom.inventory.equipment) {
      const { compatibleSlotIds } = equipment.getCompatibleSlots();
      for (const slotId of Object.values(compatibleSlotIds)) {
        equipmentBySlotIds[slotId].add(equipment);
      }
    }

    return equipmentBySlotIds;
  }

  solve() {
    this.dropAllCharacterItemsOnGround();
    const equipmentBySlotType = Equipment.groupBySlotTypeCompatibility(
      this.party.currentRoom.inventory.equipment
    );

    const unused = this.scoreDominationSolver.getCapacityDominatedEquipment(equipmentBySlotType);
    const equipmentBySlotIds = this.getPartyEquipmentByCompatibleSlotIds();

    // - sort equipment slots in random order
    const shuffledSlotIds = ArrayUtils.shuffle(
      iterateNumericEnum(EquipmentSlotId),
      new BasicRandomNumberGenerator()
    );

    const assignedEquipment = new Set<Equipment>();

    // - for each slotId
    for (const slotId of shuffledSlotIds) {
      //   - for each item that fills that slot
      const compatibleItems = equipmentBySlotIds[slotId];

      for (const equipment of compatibleItems) {
        if (unused.has(equipment)) {
          continue;
        }

        // for each party member
        const performanceDifferenceByCharacter = new Map<CombatantId, number>();
        for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
          const combatantProperties = combatant.getCombatantProperties();
          const combatantEquipment = combatantProperties.equipment;
          // measure goal performance
          const performanceBefore = this.getGoalPerformance(combatant);
          // try on the item
          const shouldEquipToAltSlot = ALTERNATE_SLOT_IDS.includes(slotId);
          const displaced = combatantEquipment.equipItemFromGround(
            equipment.getEntityId(),
            this.party.currentRoom.inventory,
            shouldEquipToAltSlot
          );
          // record how much the goal performance increased
          const performanceAfter = this.getGoalPerformance(combatant);
          const performanceDifference = performanceAfter - performanceBefore;
          performanceDifferenceByCharacter.set(combatant.getEntityId(), performanceDifference);
          // put back original equipment
          combatantEquipment.unequipSlots([slotId]);
          combatantProperties.inventory.dropAll(this.party);
          for (const { equipmentId, fromSlotId } of displaced.unequipped) {
            const cameFromAltSlot = ALTERNATE_SLOT_IDS.includes(fromSlotId);
            combatantEquipment.equipItem(equipmentId, cameFromAltSlot);
          }
        }

        //     - give the item to character who's goal performance increased the most
        const characterIdMostImproved = MapUtils.getKeyWithLargestValue(
          performanceDifferenceByCharacter
        );
        // it is possible the equipment did not improve anyone's performance
        if (characterIdMostImproved !== undefined) {
          // equip the item
          // - record that item as "tested: assigned to character x, with new GoalPerformanceScore"
          assignedEquipment.add(equipment);
          //     - if the item displaced a previously tested item
          //       - place it back in the pool for re-testing
        }
      }

      //     - after all items in this slot tested, check displaced items
      //       - each item should have a GoalPerformanceScore change for each character that didn't initially get the item
      //       - any item they actually did get should also have a GoalPerformanceScore
      //       - assign the displaced item to the character it would increase GoalPerformanceScore the most for
      //         - if it displaces their item, put that item back in the re-check pool
      //         - if no character wants it, put it in the UnusedEquipment pile
      // - return the UnusedEquipment pile to the caller for sharding or exclusion from future testing
    }
  }

  static getCombatantGroupEquipmentCapacities(combatants: Combatant[]) {
    const totals: Record<EquipmentSlotType, number> = {
      [EquipmentSlotType.Head]: 0,
      [EquipmentSlotType.Body]: 0,
      [EquipmentSlotType.Finger]: 0,
      [EquipmentSlotType.Neck]: 0,
      [EquipmentSlotType.MainHand]: 0,
      [EquipmentSlotType.OffHand]: 0,
    };

    for (const combatant of combatants) {
      for (const [_slotId, slot] of combatant.combatantProperties.equipment.getAllActiveSlots()) {
        totals[slot.type] += 1;
      }
    }

    return totals;
  }
}
