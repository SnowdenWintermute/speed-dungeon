// Claude's findings before wiring ladder game record service calls:
//
// ● Reviewed the policies and the lifecycle wiring. The schema/repo design is sound, but there's one critical gap in the write seam and
//   several design decisions/stale notes to resolve before the LadderRecordsService goes in.

//   Critical: the floor-descent write seam is dead code

//   onFloorDescent — on both policy families — is defined and overridden (ironman persistence-policy.ts saves the run; the ladder
//   policies are stubbed to write floor records) but never invoked anywhere. descendParty (dungeon-exploration.ts:112) increments the
//   floor and handles escape inline, but never calls persistence.onFloorDescent or ladder.onFloorDescent. Compare:
//   escape/wipe/start/leave hooks are wired (dungeon-exploration.ts:165-166, game-lifecycle/index.ts:150-151,
//   battle-processor/index.ts:185).

//   Consequences:
//   - The per-floor ladder records — clear times and character/pet snapshots, i.e. the entire balance-analysis payload — have no
//   trigger. Nothing would ever write them.
//   - The ironman run is not saved on floor descent despite the override (notes call for per-floor saves as crash mitigation). Today it
//   only saves at start/leave.

//   So step one of the next increment is wiring descendParty → onFloorDescent for both families. Two traps when you do:
//   - Off-by-one: descendParty increments the floor at line 116 before any hook fires, so the floor you just cleared is
//   getCurrentFloor() - 1. Capture the cleared floor (and its time-on-floor) before the increment, or pass it explicitly.
//   - Terminal floor: escape (in descendParty) and wipe (in battle-processor) don't pass through onFloorDescent, so the last floor's
//   clear-time record and final snapshot must be written inside onPartyEscape/onPartyWipe. The current escape/wipe stubs only mention
//   fate, not the final floor-clear record.

//   Design decisions to settle

//   1. LadderUpdatePolicy has no records-service dependency. Its constructor injects CharacterLevelLadderService (the XP/level leaderboard — a
//   different concern) plus broadcaster/session deps, but not a LadderRecordsService. The base-class comment already flags this ("will
//   need access to ladder services, or be owned by a composing class that can pass the services"). We need to inject the new service
//   here.

//   2. Where do ironman's game/party/character records get created — and how do continued runs not duplicate them? Race creates them in
//   ladder.onGameStart (ranked-race-ladder-policy.ts), but ironman's ladder policy has no onGameStart — it lazily implies creation in
//   onFloorDescent. The deeper issue: an ironman run spans multiple play sessions, and onGameStart fires again on every continue, so a
//   naive insert would create duplicate game records per session. This needs a create-once/idempotent path keyed to the persistent run
//   (the run's stable GameId). It also bears on the repos — ladderGameRecordsRepo.insert currently has no ON CONFLICT, and we'd need to
//   decide whether the ladder game record is keyed by the run's GameId for ironman. This is the one I'd most want your call on.

//   3. When is the denormalized mainClassLevel refreshed? Race notes update levels on leave/escape/wipe; onPartyBattleVictory (where
//   levelups actually happen) is a no-op. Suggest refreshing last-known level at floor descent + terminal events rather than every
//   battle — the updateClassLevels repo method supports it; just pick a consistent cadence.

//   4. Control-scheme "which ladder" TODO (ranked-race-ladder-policy.ts: "switch on game control scheme"). I believe that applies to
//   the per-scheme XP leaderboards (CharacterLevelLadderService), not the records — our records carry control_scheme as a column, so one table
//   + filter covers Freelancer vs Captains. Worth confirming so we don't build separate record tables.

//   Stale notes vs the finalized schema (low-risk, just cleanup)

//   - The ironman ladder note stores characters inline as { name, combatantClass, experience }[] on the party — but the schema uses
//   separate LadderCharacterRecord rows keyed on level, not experience, plus the snapshots. Follow the schema.
//   - The note "update the player's profiles to reference the ironman ladder party record" contradicts the normalized design —
//   participant↔game linkage lives in the ladder_game_participant_records join table, so profiles should not hold ladder record refs.
//   - Confirmed-good, no action: UnrankedRaceModeLadderPolicy is empty (inherits no-ops) and RaceModesPersistencePolicy is all no-ops —
//   consistent with "unranked races don't persist records."

//   Suggested order for the next increment

//   1. Wire descendParty → onFloorDescent (both families), handling the off-by-one and terminal-floor cases.
//   2. Decide #2 (ironman record creation / continued-run idempotency) — gates the repo ON CONFLICT choices.
//   3. Build LadderRecordsService + strategy interface + inject it into the ladder policies.
//   4. Implement the ironman + ranked-race ladder policy bodies against it.
//   5. Postgres strategy + rewire the three route handlers.
