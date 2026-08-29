import {
  AdventuringParty,
  Combatant,
  CombatantId,
  Equipment,
  EquipmentSlotId,
  EquipmentSlotType,
  invariant,
  iterateNumericEnum,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { EquipmentScoreDominationSolver } from "./equipment-score-domination.ts";
import { GoalPerformance } from "../goal-performance-checkers/index.ts";
import { AnalysisSpecContext } from "../analysis-runs/analysis-spec-context.ts";
import { PerformanceComparison } from "./performance-comparison.ts";

export class BestImprovementEquipmentSolver {
  private scoreDominationSolver: EquipmentScoreDominationSolver;
  private currentPerformanceByCharacter = new Map<CombatantId, GoalPerformance>();
  private _equipmentMissedByChecker: Equipment[] = [];

  constructor(
    private party: AdventuringParty,
    private analysisSpecContext: AnalysisSpecContext
  ) {
    this.scoreDominationSolver = new EquipmentScoreDominationSolver(
      BestImprovementEquipmentSolver.getCombatantGroupEquipmentCapacities(
        party.combatantManager.getPartyMemberCharacters()
      ),
      BestImprovementEquipmentSolver.unionEquipmentScoreAxes(analysisSpecContext)
    );
  }

  /**
   * Every axis any goal in the party scores on. Union, because an item is pruned when it scores on
   * none of them: scoring only the axes of one goal would delete the gear another was walking for.
   */
  private static unionEquipmentScoreAxes(analysisSpecContext: AnalysisSpecContext) {
    const axes = new Set<(equipment: Equipment) => number>();
    for (const checker of analysisSpecContext.getGoalPerformanceCheckers()) {
      for (const axis of checker.equipmentScoreAxes) {
        axes.add(axis);
      }
    }
    return [...axes];
  }

  private getBaselinePerformance(combatant: Combatant) {
    const cached = this.currentPerformanceByCharacter.get(combatant.getEntityId());
    if (cached !== undefined) {
      return cached;
    }
    const currentFloor = this.party.dungeonExplorationManager.getCurrentFloor();

    const spec = this.analysisSpecContext.requireSpec(combatant.getEntityId());
    const performance = this.analysisSpecContext
      .requireGoalPerformanceChecker(combatant.getEntityId())
      .checkPerformance(combatant, spec, currentFloor);
    this.currentPerformanceByCharacter.set(combatant.getEntityId(), performance);
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

  private tryOnEquipment(
    combatant: Combatant,
    equipmentToCheck: Equipment,
    slotId: EquipmentSlotId,
    shouldEquipToAltSlot: boolean
  ) {
    const combatantProperties = combatant.getCombatantProperties();
    const combatantEquipment = combatantProperties.equipment;
    const roomInventory = this.party.currentRoom.inventory;

    const characterSpec = this.analysisSpecContext.requireSpec(combatant.getEntityId());
    const { equipmentType } = equipmentToCheck.equipmentBaseItemProperties;
    if (!characterSpec.combatantWouldConsiderEquipmentTypeInSlot(equipmentType, slotId)) {
      return null;
    }

    const performanceBefore = this.getBaselinePerformance(combatant);

    const displaced = combatantEquipment.equipItemFromGround(
      equipmentToCheck.getEntityId(),
      roomInventory,
      shouldEquipToAltSlot
    );

    // use the checker directly, not the maybe-cached value
    const currentFloor = this.party.dungeonExplorationManager.getCurrentFloor();
    const performanceAfter = this.analysisSpecContext
      .requireGoalPerformanceChecker(combatant.getEntityId())
      .checkPerformance(combatant, characterSpec, currentFloor);
    const comparison = PerformanceComparison.between(performanceBefore, performanceAfter);

    // undoing a hypothetical, so each item goes straight back to the slot it came out of rather
    // than through equipItem. requirements are checked against current *total* attributes, which
    // include worn gear, so re-equipping one at a time can find an item unwearable partway through
    // the restore even though the character was wearing all of them a moment ago
    combatantEquipment.unequipSlots([slotId]);
    for (const { equipmentId, fromSlotId } of displaced.unequipped) {
      const displacedEquipment = combatantProperties.inventory.removeExpectedEquipment(equipmentId);
      combatantEquipment.putEquipmentInSlot(displacedEquipment, fromSlotId);
    }
    combatantProperties.inventory.dropAll(this.party);

    return { performanceAfter, comparison };
  }

  private comparePerformanceWithEquipment(
    equipmentToCheck: Equipment,
    slotId: EquipmentSlotId,
    shouldEquipToAltSlot: boolean
  ) {
    const { combatantManager } = this.party;
    const comparisonByCharacter = new Map<
      CombatantId,
      { comparison: PerformanceComparison; total: GoalPerformance }
    >();

    for (const combatant of combatantManager.getPartyMemberCharacters()) {
      const combatantProperties = combatant.getCombatantProperties();
      const combatantEquipment = combatantProperties.equipment;
      if (!combatantEquipment.canEquip(equipmentToCheck).allowed) {
        continue;
      }

      const tried = this.tryOnEquipment(combatant, equipmentToCheck, slotId, shouldEquipToAltSlot);

      const specialtyWouldNotConsiderIt = tried === null;
      if (specialtyWouldNotConsiderIt) {
        continue;
      }

      comparisonByCharacter.set(combatant.getEntityId(), {
        comparison: tried.comparison,
        total: tried.performanceAfter,
      });
    }

    return comparisonByCharacter;
  }

  private getMostImprovedCombatant(
    comparisonByCharacter: Map<
      CombatantId,
      { comparison: PerformanceComparison; total: GoalPerformance }
    >
  ) {
    let characterIdMostImproved: CombatantId | undefined = undefined;
    let bestComparison: PerformanceComparison | undefined = undefined;
    for (const [combatantId, { comparison }] of comparisonByCharacter) {
      if (!comparison.isImprovement()) {
        continue;
      }
      if (bestComparison === undefined || comparison.beats(bestComparison)) {
        bestComparison = comparison;
        characterIdMostImproved = combatantId;
      }
    }

    return characterIdMostImproved;
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

      const comparisonByCharacter = this.comparePerformanceWithEquipment(
        equipmentToCheck,
        slotId,
        shouldEquipToAltSlot
      );

      // give the item to character who's goal performance increased the most
      const characterIdMostImproved = this.getMostImprovedCombatant(comparisonByCharacter);

      const noCombatantWouldBenefit = characterIdMostImproved === undefined;
      if (noCombatantWouldBenefit) {
        continue;
      }

      const characterNewPerformance = comparisonByCharacter.get(characterIdMostImproved);
      invariant(characterNewPerformance !== undefined);

      const combatantReceiving = combatantManager.getExpectedCombatant(characterIdMostImproved);
      this.currentPerformanceByCharacter.set(
        combatantReceiving.getEntityId(),
        characterNewPerformance.total
      );
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

    return displacedEquipmentFromAssignments;
  }

  get equipmentMissedByChecker() {
    return this._equipmentMissedByChecker;
  }

  /** Mutates combatant equipment in place */
  solve() {
    this.dropAllCharacterItemsOnGround({ includeEquipped: false });
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      const spec = this.analysisSpecContext.requireSpec(combatant.getEntityId());
      this.currentPerformanceByCharacter.set(
        combatant.getEntityId(),
        this.analysisSpecContext
          .requireGoalPerformanceChecker(combatant.getEntityId())
          .checkPerformance(
            combatant,
            spec,
            this.party.dungeonExplorationManager.getCurrentFloor()
          )
      );
    }

    const equipmentBySlotType = Equipment.groupBySlotTypeCompatibility(
      this.party.currentRoom.inventory.equipment
    );

    const unused = this.scoreDominationSolver.getCapacityDominatedEquipment(equipmentBySlotType);
    // const unused = new Map();

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
    const unusedEquipment = [...this.party.currentRoom.inventory.equipment];
    this.party.currentRoom.inventory.deleteAllItems();

    const scoreByCharacter = new Map<CombatantId, number>();
    for (const [combatantId, performance] of this.currentPerformanceByCharacter) {
      scoreByCharacter.set(combatantId, performance.score);
    }

    return { performanceByCharacter: scoreByCharacter, unusedEquipment };
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
