import {
  AdventuringParty,
  ALTERNATE_SLOT_IDS,
  Combatant,
  CombatantId,
  Equipment,
  EquipmentSlotId,
  EquipmentSlotType,
  invariant,
  iterateNumericEnum,
  MapUtils,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { EquipmentScoreDominationSolver } from "./equipment-score-domination";

export class BestImprovementEquipmentSolver {
  private scoreDominationSolver: EquipmentScoreDominationSolver;
  private unusedItems: Equipment[] = [];
  private cachedPerformanceByCharacter = new Map<CombatantId, number>();
  private _equipmentMissedByChecker: Equipment[] = [];

  constructor(
    private party: AdventuringParty,
    //  - measure current goal performance
    //    - for auto-attack damage this is "average damage on target dummy sampled over x attacks"
    //      and for weapons "does this weapon fit this character archetype specification"
    //    - filter weapons by character archetype specification
    //    - for basic spirit users this is "total spirit"
    private goalPerformanceChecker: (combatant: Combatant) => number,
    equipmentScoreAxisCheckers: ((equipment: Equipment) => number)[]
  ) {
    this.scoreDominationSolver = new EquipmentScoreDominationSolver(
      BestImprovementEquipmentSolver.getCombatantGroupEquipmentCapacities(
        party.combatantManager.getPartyMemberCharacters()
      ),
      equipmentScoreAxisCheckers
    );
  }

  private getBaselinePerformance(combatant: Combatant) {
    const cached = this.cachedPerformanceByCharacter.get(combatant.getEntityId());
    if (cached !== undefined) {
      return cached;
    }
    const performance = this.goalPerformanceChecker(combatant);
    this.cachedPerformanceByCharacter.set(combatant.getEntityId(), performance);
    return performance;
  }

  private dropAllCharacterItemsOnGround(options: { includeEquipped: boolean }) {
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      if (options.includeEquipped) {
        combatant.getEquipmentOption().unequipAll();
      }
      combatant.requireInventory().dropAll(this.party);
    }
  }

  private allCompatibleSlotsAlreadyProcessed(equipment: Equipment, slotId: EquipmentSlotId) {
    const { compatibleSlotIds } = equipment.getCompatibleSlots();
    return Object.values(compatibleSlotIds).every((compatibleSlotId) => compatibleSlotId < slotId);
  }

  private assignImprovingEquipment(candidates: Set<Equipment>, slotId: EquipmentSlotId) {
    const { combatantManager } = this.party;
    const roomInventory = this.party.currentRoom.inventory;
    const displacedEquipmentFromAssignments = new Set<Equipment>();

    for (const equipmentToCheck of candidates) {
      invariant(
        equipmentToCheck.isCompatibleWithSlotId(slotId),
        "expected a candidate compatible with the slot being filled"
      );
      const { compatibleSlotIds } = equipmentToCheck.getCompatibleSlots();
      const shouldEquipToAltSlot = compatibleSlotIds.alternate === slotId;

      const performanceDifferenceByCharacter = new Map<CombatantId, number>();

      for (const combatant of combatantManager.getPartyMemberCharacters()) {
        const combatantProperties = combatant.getCombatantProperties();
        const combatantEquipment = combatantProperties.equipment;
        if (!combatantEquipment.canEquip(equipmentToCheck).allowed) {
          continue;
        }

        // measure goal performance
        const performanceBefore = this.getBaselinePerformance(combatant);
        // try on the item
        const displaced = combatantEquipment.equipItemFromGround(
          equipmentToCheck.getEntityId(),
          roomInventory,
          shouldEquipToAltSlot
        );

        // use the checker directly, not the maybe-cached value
        const performanceAfter = this.goalPerformanceChecker(combatant);
        const performanceDifference = performanceAfter - performanceBefore;
        performanceDifferenceByCharacter.set(combatant.getEntityId(), performanceDifference);
        // put back original equipment
        combatantEquipment.unequipSlots([slotId]);
        for (const { equipmentId, fromSlotId } of displaced.unequipped) {
          const cameFromAltSlot = ALTERNATE_SLOT_IDS.includes(fromSlotId);
          combatantEquipment.equipItem(equipmentId, cameFromAltSlot);
        }
        combatantProperties.inventory.dropAll(this.party);
      }

      // give the item to character who's goal performance increased the most
      const atLeastOneCharacterImproved = performanceDifferenceByCharacter
        .values()
        .some((value) => value > 0);
      const characterIdMostImproved = MapUtils.getKeyWithLargestValue(
        performanceDifferenceByCharacter
      );

      // it is possible the equipment did not improve anyone's performance
      if (atLeastOneCharacterImproved && characterIdMostImproved !== undefined) {
        const combatantReceiving = combatantManager.getExpectedCombatant(characterIdMostImproved);
        this.cachedPerformanceByCharacter.delete(combatantReceiving.getEntityId());
        // equip the item
        const displaced = combatantReceiving
          .getEquipmentOption()
          .equipItemFromGround(equipmentToCheck.getEntityId(), roomInventory, shouldEquipToAltSlot);

        // place displaced items back in pool for testing
        this.dropAllCharacterItemsOnGround({ includeEquipped: false });
        for (const { equipmentId } of displaced.unequipped) {
          const displacedEquipment = roomInventory.requireItem(equipmentId);
          invariant(displacedEquipment instanceof Equipment);
          // items belonging to another slot are left in the room for that slot's pass.
          // this means if a 2h weapon is displaced by equiping to the offhand slot it will be
          // missed by the checker.
          if (displacedEquipment.isCompatibleWithSlotId(slotId)) {
            displacedEquipmentFromAssignments.add(displacedEquipment);
          } else if (this.allCompatibleSlotsAlreadyProcessed(displacedEquipment, slotId)) {
            this._equipmentMissedByChecker.push(displacedEquipment);
          }
        }
      }
    }

    return displacedEquipmentFromAssignments;
  }

  get equipmentMissedByChecker() {
    return this._equipmentMissedByChecker;
  }

  /** mutates equipment in place */
  solve() {
    // thinking of removing this to persist equipment room by room
    // and save a lot of tests on known-decent gear sets
    // but will need to try with/without it to check results and performance
    // differences
    this.dropAllCharacterItemsOnGround({ includeEquipped: true });
    const equipmentBySlotType = Equipment.groupBySlotTypeCompatibility(
      this.party.currentRoom.inventory.equipment
    );

    const unused = this.scoreDominationSolver.getCapacityDominatedEquipment(equipmentBySlotType);

    // important that MainHand appears in the enum listing before offhand since
    // we want to prioritize mainhand upgrades over offhand upgrades. If offhand goes
    // first, then later a 2h weapon displaces an offhand shield, that shield will never
    // be re-checked. As it is, mainhand goes first so if an offhand displaces a 2h weapon
    // it will not be re-checked.
    for (const slotId of iterateNumericEnum(EquipmentSlotId)) {
      const partyEquipment = this.party.currentRoom.inventory.equipment;
      const compatibleItems = Equipment.groupBySlotIdCompatibility(partyEquipment)[slotId];
      let candidates = compatibleItems.difference(unused);
      let loopSafetyCounter = 0;
      while (candidates.size > 0) {
        throwIfLoopLimitReached(loopSafetyCounter++, "best improvement solver safety limit");
        candidates = this.assignImprovingEquipment(candidates, slotId);
      }
    }

    // anything left on the ground can be considered unused and deleted
    this.unusedItems.push(...this.party.currentRoom.inventory.equipment);
    this.party.currentRoom.inventory.deleteAllItems();
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
      for (const [_slotId, slot] of combatant.getEquipmentOption().getAllActiveSlots()) {
        totals[slot.type] += 1;
      }
    }

    return totals;
  }
}
