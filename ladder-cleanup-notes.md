# Ladder Code Quality Pass — Running Notes

Working doc for the multi-session cleanup of the ladder/profiles code, after the feature itself
landed. Maintained by Claude across sessions; throw it out when the pass is done, alongside
`ladder-rebuild-notes.md`. Purpose is cross-session context, not permanent documentation.

Started 2026-07-30, from Mike's five criteria in `mikes-ladder-notes.txt`:
extractable logic, local utils/consts that want a real home, unnecessary complexity, applicable
design patterns, free-floating functions that could be grouped into classes.

Guiding books, per Mike: Evans (DDD), McConnell (Code Complete 2), Fowler (Refactoring).

**Mike does not read this file** — it is Claude's cross-session scratch context. He reads the diffs.
So: precise pointers over prose, and record decisions + rejected alternatives, not explanations.

### File map

- contract + DTOs: `packages/common/src/ladder/queries/`
- record model + projections + strategies: `packages/common/src/ladder/records/`
- write-side policies: `packages/common/src/game-modes/*/ladder-policy.ts`, `ladder-update-policy.ts`
- postgres strategy: `packages/server/src/game-node/services/database-ladder-records-persistence-strategy.ts`
- repos: `packages/server/src/database/repos/ladder-*.ts` (base class in `repos/index.ts`)
- client store: `packages/client-application/src/ladder-view/`, `client-ladder-queries.ts`
- pages: `packages/frontend/src/app/ladder/`, `packages/frontend/src/app/profile/`

---

## The mental model (write this down once, refer back to it)

One request, all the way down:

```
URL  →  query-schemas.ts (zod parses/defaults; untrusted text stops here)
     →  ParsedLadderQuery / ParsedRouteParam (render nothing until it parsed)
     →  Board component  →  useLadderQuery(cache, query)
     →  KeyedQueryCache (one entry per distinct query, keyed by its fields)
     →  ClientLadderQueries          ← the client's impl of the LadderQueries interface
     →  [socket: one intent type, one reply type — LadderQueryRequest/Result]
     →  LadderGameRecordsController  →  executeLadderQuery(...)
     →  LocalLadderQueries           ← the server's impl of the SAME interface
     →  LadderGameRecordsService  →  LadderRecordsPersistenceStrategy (in-memory | Postgres)
     →  ladder-read-model-projections.ts  ← the shared "records → read model" math
```

Four rules explain nearly every decision in there:

1. `LadderQueries` is one interface with two implementations. `ClientLadderQueries` sends;
   `LocalLadderQueries` executes. Offline skips the socket and calls `LocalLadderQueries` in
   process. A query that behaves differently online vs offline is a bug in the transport pair.
2. `…Query` in, `…View` out. Views hold usernames; records/`…Entry` hold ids. Username resolution
   happens in exactly one place: `LocalLadderQueries.resolverForPlayers`.
3. Rank belongs to a board, not to a row. Hence `Record<id, number>` maps beside the rows, and no
   rank on a detail page.
4. Projections are storage-agnostic. In-memory is the oracle; Postgres must agree with it,
   tie-breaks included (`compareIds` ↔ `CUMULATIVE_BOARD_ORDER`).

**Debugging shortcut — symptom to layer:** wrong number → projections. Wrong order →
the comparator/SQL `ORDER BY` pair. Wrong name → `resolverForPlayers`. Wrong rows on a page →
validation or `pageSizeOf`. Stale or blank forever → `KeyedQueryCache`.

---

## The plan (6 steps, ordered by risk)

1. **Free wins, no behavior change** — dead code + stale comments.
2. **The two bugs** — failed queries can't recover; game history opted out of the paging rules.
3. **Extract & hoist** — duplicated display strings and comparators into real homes.
4. **Template Method on the two record-writing policies** + parameter object for the 8-arg constructor.
5. **`FloorClearRecordSet` class** in the projections.
6. **Remove the middle man** on the read side + `findWhereIn` on `DatabaseRepository` + row mappers
   into the repos.

Steps 1–3 are mechanical. 4–6 change structure and each wants a test run.

---

## Status

- Steps 1–3: **DONE 2026-07-30**, full suite green (Mike ran it).
- Step 4: **DONE 2026-07-30**, not yet test-run. Built differently than planned — see below.
- Steps 5–6: not started.

## Step 4 as built — no intermediate base class

I started writing `GameRecordWritingLadderPolicy` between the abstract base and the two concrete
policies. **Mike rejected the extra inheritance level** and he was right: three levels to answer
"what does ironman do on a wipe", in a codebase whose main diagnosis was too many layers.

Also rejected, by me, before proposing it: a `LadderRecordWriter` collaborator object. It would have
inserted another hop between the policies and `LadderGameRecordsService`, which step 6 exists to thin.

**What was actually done:** the repeated idiom became `protected syncGameRecords(game)` on the
existing `GameModeLadderUpdatePolicy` that all four modes already extend. 8 duplicated two-liners →
one helper. Ironman and RankedRace keep their own hook methods, which is what makes each policy
readable as a table of event → behavior without traversing parents.

`announceLadderEvent(outbox, partyChannel, messageType, text)` went on the same base, replacing 3
copies of the push-to-party-then-fan-out-to-everyone block. **It is on the base, not on
`ProgressionModeLadderPolicy` where the copies were**, because Mike flagged that upcoming events
("party X set a record for fastest cumulative clear of floor 9") originate from floor clears — which
only ironman and ranked race write. The first future caller is a different class than the current ones.

`LadderPolicyDependencies` replaced the 8 positional constructor args. **Named "Dependencies", not
"Services"** — Mike asked whether "services" was fair in DDD terms and it isn't: two of the seven are
Repositories wearing a Service name, three are infrastructure/delivery, one is a lookup over
transient session state. Renaming the individual classes is a repo-wide job, deliberately not done here.

`idGenerator` was dropped from the ladder policies entirely — zero uses across all four.

**Correction to record:** my first justification comment for the parameter object claimed a swapped
pair of arguments would still compile. Mike caught it; it's false, all seven are structurally
distinct. The real reason is that all four modes take the same seven, so the set is built once.

### Follow-on: the other policy families (Mike asked about consistency)

Applied the same rule — *when several classes take the same set of collaborators, name the set* —
rather than "parameter objects everywhere", which would have made things worse in one case:

| family | params | got a bundle? |
|---|---|---|
| lobbySetup | 7 | yes — `LobbySetupPolicyDependencies` |
| persistence | 4 | yes — `PersistencePolicyDependencies` |
| gameInitialization | 1 | **no** — wrapping one argument is strictly worse |
| inGameDecisions | 0 | nothing to do |

Deliberately **not** one omnibus `PolicyDependencies`: part of what each bundle buys is a narrow
statement of what that policy family may touch. Merging them would let every policy reach everything.

All 8 construction sites were byte-identical and all live in `game-mode-policy-store.ts`; no subclass
declares its own constructor, so only the two base classes changed. Each mode entry in the store is
now 5 lines, so the *shape* of a mode is visible at a glance.

### `GameModePolicyStore`'s own 11 positional params — TRIED AND REVERTED. Do not re-propose.

Built it, Mike said it didn't help the way the family bundles did, and he was right. Reverted with
`git reset --hard` (the family bundles were already committed at `705be76f`, so only this was lost).

Why the store fails the same test the families passed:

| | policy families | the store |
|---|---|---|
| classes taking the set | 4 each | 1 |
| construction sites | 4, byte-identical | 2, **not** identical |
| repeated lines removed | 28 → 4 | none — there was no duplication |
| bundle constrains reach? | yes, per family | no, it is "everything" |
| net line change | large reduction | **+22** |

All 11 types are structurally distinct, so there was no miswiring for named arguments to prevent
either. What remained was "11 named arguments read better than 11 positional ones at two call
sites" — true, but not worth an interface plus an 11-line destructure.

**The rule, stated properly:** *when several classes take the same set of collaborators, name the
set.* Not "many parameters → parameter object". I had already written that rule one message earlier
and over-applied it anyway.

### Naming inconsistencies noticed here, NOT fixed (each its own small pass)

- Same object is `updateDispatchFactory` on the store and ladder bundle, but
  `messageDispatchFactory` on the lobby-setup and persistence bundles/fields.
- `ladderGameRecordsService` (store, matches the class `LadderGameRecordsService`) vs
  `gameRecordsLadderService` (the ladder policy's field, words swapped). ~14 use sites.
- `game-server/index.ts` constructs a throwaway `GameExistenceChecker(new LobbyState(), …)` purely to
  fill the parameter, because only lobby-setup policies use it and those never run on a game server.
  Real fix is that a game server shouldn't assemble lobby-setup policies at all — bigger question.

## Steps 1–3 as built (2026-07-30)

**Deleted:** `ladder/records/notes.ts` (unimported scratch); `loadCharactersByIds` (unused);
`KeyedQueryCache.refresh()` and `LadderQueryState.lastUpdatedAt` (both written, never read);
the redundant `if (lobbyClientRef.isInitialized)` block in `enterOnline` (same predicate as the
`else` below it, so `stopAwaitingReplies` + `failAllPendingQueries` ran twice per reconnect).

**Behavior changes, deliberate:**
- In-memory `recordRunAbandonment` no longer logs when there is no participation to abandon; it
  no-ops, matching SQL where the UPDATE matches no rows. (It previously had an unreachable
  `invariant` after an early return.)
- Reconnect now calls `ladderView.clear()` via `discardAnswersFromPreviousConnection`. This is the
  fix for "a failed query stays failed until a full page load" — a cache entry counts as asked, so
  clearing is the only way back. Verified the retry actually fires: `isConnected` is true only for
  `ConnectionStatus.Connected`, and `enterOnline` sets `Initializing` first, so `useLadderQuery`'s
  effect re-runs on reconnect against an empty cache. `isSuperseded` is now load-bearing for a real
  case (pre-reconnect fetch landing after its replacement).
- Game history paging now agrees with itself: `validateUserGameHistoryQuery` checks depth against
  `USER_GAME_HISTORY_PAGE_SIZE` (it was inheriting `validatePagedQuery`'s 20 via a `pageSizeOption`
  that type doesn't even have), and `totalPages` comes from `totalPagesOf` instead of a raw
  `Math.ceil`. Extracted `validatePageDepth(page, pageSize)` as the shared rule.

**Hoisted:**
- `compareStringsOrdinally` → `common/src/utils/index.ts`, replacing the private `compareIds` in the
  projections and the nested ternary in `byMostExperienced`.
- `controlSchemePlural` → beside the `CharacterControlScheme` enum in `common/src/game-modes/index.ts`.
- new `frontend/src/app/ladder/display-text.ts` — `NO_VALUE_TEXT` (was `"—"` in 6 places across 5
  files) and `optionalTimestampText` (the abandoned-at ternary, duplicated verbatim in two column files).
- new `frontend/src/app/ladder/board-text.ts` — `LADDER_BOARD_NAMES` (consumed by the tab bar, so the
  names are not mirrored), the three board title builders, `LADDER_EMPTY_MESSAGES`. Each board title
  had existed in 2–3 places.

**Mike's corrections this session** (also saved to memory):
- Stale/garbled comments: **delete, don't rewrite**. I repaired one and he pushed back.
- No articles in identifiers (`discardAnswersFromPreviousConnection`).
- Don't narrow a name past the signature (`compareStringsOrdinally`, not `…Ids…`).
- A general helper goes next to the type it concerns, not in the feature that needed it first.

---

## Step 4 — Template Method on the record-writing policies (NOT STARTED)

`IronmanModeLadderPolicy` and `RankedRaceModeLadderPolicy` are the same class twice. This body
appears **8 times** across the two files:

```ts
const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
```

`onFloorDescent`, `onPartyEscape`, `onPartyWipe`, `onPartyBattleVictory` are byte-identical between
them. They genuinely differ in only three places:

- ironman's `isContinuedRun` guard on `onGameStart`
- ironman's `onLastPlayerLeftLiveGame`
- race's extra fate persistence on `onPartyWipe` (the solo-leave path)

Plan: a shared `GameRecordWritingLadderPolicy` base with a `protected syncGameRecords(game)` step;
subclasses hold only their differences. ~60 lines gone, and the mode difference becomes readable.

Also here: `GameModeLadderUpdatePolicy`'s 8-parameter constructor → one injected
`LadderPolicyServices` parameter object. `UnrankedRaceModeLadderPolicy` inherits all 8 and uses none.

And: `ProgressionModeLadderPolicy.onPartyBattleVictory` is a 90-line method containing the same
"push to party channel + publish to everyone else" block twice, verbatim but for the message text.
Extract `announceLadderProgress(text, partyChannel, outbox)`.

## Step 5b — record-bag cleanup (NOT STARTED — Mike explicitly said don't forget this)

Split out of step 5 so 5a could land with no cross-file changes. **5b is the part with the real
conceptual mess**, and the only part that reaches outside `ladder-read-model-projections.ts`:

- `projectPlayerProfileData` hand-builds two overlapping sub-bags, `assemblyRecords` and
  `selectionRecords`, because three functions each want a different subset of one clump.
- `DatabaseLadderRecordsPersistenceStrategy.getPlayerProfileData` builds **those same two shapes
  again**, independently.
- `selectPersonalBestPartyFloorClears` and `assemblePersonalBestEntries` each take their own
  ad-hoc inline record-bag type rather than a named one.

Riskier than 5a: a mistake changes what a profile page shows rather than failing loudly. Do it as its
own step with a full suite run.

## Step 5a — `FloorClearAssembler` + the projection→assembly vocabulary fix — DONE 2026-07-30

**Naming went through three wrong answers before landing.** Recorded because the reasoning generalises:

- `FloorClearRecordSet` — "Set" implies unique members; it isn't one.
- `FloorClearIndex` — named for the maps it holds, i.e. for its fields rather than its job. But
  `assemble()` builds a whole read model and `rankedByCumulative()` sorts a board; neither is indexing.
- `FloorClearProjection` — matched the file's existing verb, but **Mike checked the CQRS definition**:
  projecting is folding a *stream of events* into a structural representation, usually stored. We have
  no events, nothing stored, no incremental fold.

Landed on **`FloorClearAssembler`**, which is Fowler's PoEAA Assembler (domain objects → DTOs). The
strategies' `rowToRecord` functions are the Data Mapper half of the same picture.

The file already had **three verbs** — `project…` (8), `assemble…` (2), `select…` (1) — so the
vocabulary was muddled before this. Settled as: **assemble… returns a read model, select… returns the
records that won, compute… returns a figure.** That renamed 12 symbols and 5 files across common +
server. `projectCumulativeClearRanks` became `computeCumulativeClearRanks`, not `assemble…`, because
ranks are calculated rather than assembled.

Also folded in at Mike's call (he'd otherwise be reading a diff full of stale words): the whole
rename shipped with 5a rather than as its own commit. Safe because a bad rename fails to compile.

`rankCumulativeClears` was deleted outright — the class method replaces it.

`ladder-read-model-projections.ts` is 624 lines of free functions with an object hiding in it.
`FloorClearIndexes` is built by `indexFloorClearRecords` and then threaded as a parameter through
`assembleFloorClear`, `cumulativeTimeFromIndexes`, `gameForPartyFloorClear`, `rankCumulativeClears`
and five exported `project…` functions.

```ts
class FloorClearRecordSet {           // built once from the records bag
  gameFor(clear): LadderGameRecord | undefined
  cumulativeTimeFor(clear): Milliseconds
  assemble(clear): FloorClearEntry
  rankedByCumulative(controlScheme): RankedClear[]
}
```

The `project…` entry points stay as the public API and construct one of these. Two symptoms confirm
the diagnosis: `projectPlayerProfileData` hand-assembles two overlapping sub-bags
(`assemblyRecords` / `selectionRecords`) because three functions each want a different subset of one
clump — and `DatabaseLadderRecordsPersistenceStrategy.getPlayerProfileData` builds those same two
sub-bags again. One object dissolves both.

Smaller, same file: `pageSizeOf` / `totalPagesOf` / `paginate` are the paging rules spread over two
files with `paginate` private to the projections. Coherent concept, wants one home.

## Step 6 — Remove the middle man (NOT STARTED)

`LadderGameRecordsService`: **16 of its 24 methods are one-line forwards** to the persistence
strategy. The 8 that earn their keep are the write-side assembly (`recordNewGame`,
`updateGameRecordAggregate`, `recordPartyFloorClear`, the private record builders). Fowler's *Remove
Middle Man*. Plan: keep the service as the **write-side** domain object; let `LocalLadderQueries`
depend on `LadderRecordsPersistenceStrategy` directly for reads. Deletes ~120 lines and one layer
from the trace above.

`DatabaseLadderRecordsPersistenceStrategy` (888 lines) has **seven near-identical private loaders**
— guard empty array → `format` a `WHERE x IN (%L)` → map rows. `DatabaseRepository<T>` already has
`find`/`findOne`/`findById`; add `findWhereIn(field, values)` and move the five `rowToRecord` mappers
into the repos that define the row shapes. Roughly halves the file.

Also unresolved there: **reads bypass the repos while writes go through them.** Writes call
`ladderPartyRecordsRepo.insert`; reads hand-write `SELECT * FROM ladder_party_records`. Pick a
direction — the inconsistency costs more than either choice.

---

## Deferred / open questions

- **Comment density.** The ladder code is heavily commented against a `CLAUDE.md` that says keep
  comments to a minimum. Most are genuine *why* comments (why the tie-break is ordinal, why the
  scheme filter sits outside the window, why an empty `IN ()` guard is load-bearing) and worth
  keeping. The narration and restatement is what should go. Not done — wants Mike's judgment on how
  aggressive to be, per-file.
- `PersonalBestsSection` filters mode/control-scheme client-side over a payload that carries every
  facet. Fine at current sizes; noted in case the profile query ever gets narrowed server-side.
- `computeRankedRaceTally` rebuilds `partiesById` per game via `playerPartyInGame`, and calls
  `raceWinnerPartyIds` inside the loop. Doesn't use the indexing pattern the rest of the file uses.
  Left alone deliberately: profiler-gated, and step 5 may absorb it.
