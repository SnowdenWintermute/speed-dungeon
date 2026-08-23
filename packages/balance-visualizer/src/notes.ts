// AnalysisAdventuringPartyBuilder
// - Assemble Parties of random or selected AnalysisCharacters
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
