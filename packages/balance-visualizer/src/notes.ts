// AvailableGearInRoom
// - Equipment[]

// LootDropEvent
// - Equipment[]
// - Consumables[]

// AnalysisAdventuringPartyBuilder
// - Assemble Parties of random or selected AnalysisCharacters
//
// AnalysisDungeonRunSimulator
// - clearNextRoom
//   - return LootDropEvents, ExperiencePointGains
//
// EquipmentAttributesAggregator
//  - accepts an attributeFrom(equipment:Equipment): {total: number, affixesFrom: Record<AffixType, Percentage>}
//  - get max total attribute (including derived) that could fill all slots on interested characters
//  - divide by interested character count
//  - record %from acc affix, %from dex affix

// EquipmentSolver
// - Have each character solve its best allocation of all available attributes under analysis
//   - From gear
//   - From newly obtained discretionary attribute points
// - Create a report of each character's allocation state at that time, and the chosen metrics
//   - For attack damage
//     - Equipped holdables by slot
//     - Considered holdables available
//     - Attribute point allocations
//     - Gear point allocations
//     - Auto-attack average damage sampled vs target dummy
// - Submit reports out of the worker to the aggregator

// RunReportAggregator
// - take reports from DungeonRunSimulators running in workers
// - assemble AggregatedRunsReport

// BestImprovementEquipmentSolver
// - drop all items on ground
// - filter out dominated items (if exists seven +2 dex rings and one +1 dex ring, no one will want that +1 dex ring)
//   - add them to the UnusedEquipment pile
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
