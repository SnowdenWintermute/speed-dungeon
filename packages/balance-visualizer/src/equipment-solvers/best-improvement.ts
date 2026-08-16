import { AdventuringParty, Equipment } from "@speed-dungeon/common";

export class BestImprovementEquipmentSolver {
  unusedEquipment: Equipment[] = [];
  filteredConsiderable: Equipment[] = [];

  constructor(
    private party: AdventuringParty,
    private equipmentScoreAxisCheckers: (equipment: Equipment) => number
  ) {}

  private dropAllCharacterItemsOnGround() {
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      combatant.getEquipmentOption().unequipAll();
      combatant.requireInventory().dropAll(this.party);
    }
  }

  private getPartySlotEquipmentCapacities() {
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      // for (const taggedSlot of ALL_EQUIPMENT_SLOTS) {
      //   //
      // }
    }
  }

  // if exists seven +2 dex rings and one +1 dex ring, no one will want that +1 dex ring
  private filterSingleAxisCapacityDominated() {
    // for(const item of this.party.currentRoom.inventory.getItems()){
    // }
    //    - for each slot type
    //    - count the total slots of that type in the party
    //    - get all items that could go in that slot type
    //    - if the item count is less than the slot capacity, continue
    //    - for each item
    //      - for each score axis
    //        - push score to a list of {score: number, equipment:Equipment}[]
    //    - sort lists
    //    - for each list
    //      - for each item
    //        - if item has a non-zero score on only one list, and is not in the top SLOT_CAPACITY on that list
    //           - add them to the UnusedEquipment pile
  }

  // - sort equipment slots in random order
  // - for each slot
  //   - for each item that fills that slot
  //     - for each party member
  //       - measure current goal performance
  //         - for auto-attack damage this is "average damage on target dummy sampled over x attacks"
  //         - for basic spirit users this is "total spirit"
  //       - try on the item
  //       - record how much the goal performance increased
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
