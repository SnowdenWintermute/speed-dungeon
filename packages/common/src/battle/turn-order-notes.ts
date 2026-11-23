// BattleTimeline
// - manages a group of: BattleTimelineEntry
//   - each has a:
//   TurnDelayPolicy
//     - computeDelayOnTurnEnded(actionUser, actionName)
//     - computeDelayOnRegistered(actionUser, timelineEntryIndex): number
//     - computeBattleTimelineEntryCount(actionUser): number - if user is stopped, or not a tickable condition,
//         it gets 0, otherwise reads the "extra battle timeline entry count" from combatant properties
// - private currentlyTakingTurn: BattleTimelineEntryIdentifier | undefined
// - startTurn(): marks the appropriate BattleTimelineEntry as currently taking turn, called at the start of processCombatAction()
// - now(): a time set by startTurn()
// - computeDelayOnTurnEnded(actionName)
// - endCurrentTurn(delay:number): adds delay to the BattleTimelineEntry marked as currently taking
//   turn if it still exists (hasn't been removed by stale sweep), and clear currentlyTakingTurn
// - computeTimelineEntryDelaysOnRegistered(actionUser): { initial, accumulated }[]
// - register(IActionUser, timelineEntryDelays: {initial: number, accumulated: number }[])
//     - invariant: IActionUser's BattleTimelineEntryCount must equal the delays array length
// - unregister(EntityId): called for explicit removals, and by the stale sweep
// - forecast(): BattleTimelineForecast
