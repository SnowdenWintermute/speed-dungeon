# Ladder / Profiles Rebuild — Running Notes

Working doc for the multi-session ladder + profiles rebuild. Maintained by Claude across sessions;
throw it out when the work lands. Purpose is cross-session context, not permanent documentation.

Started 2026-07-23.

---

## Page inventory + navigation, from Mike (2026-07-26) — RESUME HERE

The frontend design is now specified. Four new queries stood between this and the JSX; **all of them,
and the two follow-on items, are built as of 2026-07-27. Nothing is left before step 6 but the JSX.** Bare-bones JSON scaffolding exists for the
two facets that already have a query (`frontend/src/app/ladder/`), and is regenerable — it is not
what to protect.

### Main ladder page — four summary tables, top 5 each

Progression XP [Freelancers], Progression XP [Captains], Deepest Cumulative Time to Clear
[Freelancers], Deepest Cumulative Time to Clear [Captains].

### Tabs

1. **Progression Experience Points** → Freelancers / Captains
2. **Deepest Cumulative Time To Clear** → Freelancers / Captains. Sorted deepest first, then fastest
   cumulative time.
3. **Fastest Floor Clears** → Ironman Freelancers / Ironman Captains / Race Freelancers / Race
   Captains. One table *per floor*, deepest floor at top, **sortable headers** (clear time,
   cumulative clear time). Rows expand to character summaries (name, main/support class, owner),
   each linking to that character's snapshot.

### Individually linkable pages

- **Floor clear** — one whole floor clear, all details plus character snapshots.
- **Game record** — game summary → every party → that party's floor clear records → links to
  character snapshots.
- **Profile** — linked from any mention of a user anywhere.
- **Progression character** — full combatant view like the in-game inventory screen (equipment,
  attributes, abilities), linked from XP ladder entries.

### Decisions (Mike, 2026-07-26)

- **No public win-rate ladder — the facet stays a stub.** Races are unfinished and will be the least
  played mode this release, and `getWinRateLadder` is also the most expensive query we have (it loads
  every ranked race game ever). Keep the built query and its tests; do not surface a public board.
  The *personal* ranked race record still shows on profiles (`PlayerProfileView.rankedRaceRecord`),
  which is cheap. Revisit if live race play ever gets busy enough to be interesting.
- **Deepest Cumulative spans game modes, deliberately.** Ironman and race have identical gameplay
  rules — race is just more ephemeral — so "how fast did you clear this floor" means the same thing
  in both, and the mode recorded per clear does not need its own board. Split them only if race ever
  gains mechanics that change floor difficulty.
- **The progression character page omits inventory, for payload size — not privacy.** Any player who
  joins a game with you already sees your whole inventory, so there is nothing to protect; it is just
  a lot of bytes nobody asked for. ⚠️ Note this is a *different* reason than the one snapshots strip
  it for: snapshots strip inventory for **storage**, since there are far more character snapshots
  than progression characters and inventory would multiply their size several times over.
- **Sorting must be server-side.** Sortable headers need a sort parameter on the query; sorting a
  fetched page client-side would reorder only those rows.

### What has to be built before the JSX

New queries on `LadderQueries`:

1. ~~**Deepest clears ladder**~~ — **BUILT 2026-07-26 as `getCumulativeClearTimes`.** Two corrections
   landed while building it. **(a) Not named "deepest".** Deepest-first is how the table *sorts*; it
   is not what a row *is*. **(b) A row is a floor clear, not a party.** Per the spec's own wording
   ("list of floor clear times, sorted by deepest, then fastest cumulative time to clear"), so this
   reuses `FloorClear`/`FloorClearView` **unchanged** — no new view type. The query is
   `{controlScheme, page}`, and all that is new is the ordering: `floor desc, cumulativeTime asc,
   then record id` (that last tie-break keeps in-memory a faithful oracle for SQL, whose row order is
   otherwise unspecified). Postgres loads every clear by the candidate parties, including clears made
   under the *other* scheme, because cumulative time sums a party's whole history below the row.
   Also added: **`clearedAt` on `LadderPartyFloorClearRecord`** (`cleared_at TIMESTAMP NOT NULL` +
   index), since the wall-clock clear time is not derivable from game start plus elapsed floor
   durations — those omit the gaps between floors. The original migration was edited in place and the
   tables dropped/recreated rather than adding a follow-up migration.
   - The test now drives **two** games — an Ironman run (floors 1 and 2) and a ranked race (floor 1)
     — so mode-spanning is covered along with ordering, the cumulative sum, `clearedAt`, and scheme
     separation. Both games take the Captain scheme by default, which is what puts them on one board;
     the ironman run is given an explicit game name so the race can claim `TEST_GAME_NAME`, and it is
     left before the race starts because `createTwoClientsInGameServerGame({ auth: true })`
     authenticates as the same player. **Green under both strategies 2026-07-26**, including with
     `RUN_POSTGRES_LADDER_TESTS=1`.
2. ~~**Floor clear by id**~~ and 3. ~~**Game record by id**~~ — **BUILT 2026-07-26 as
   `getFloorClear(id)` / `getGameRecord(id)`. Green under both strategies 2026-07-26**, including
   with `RUN_POSTGRES_LADDER_TESTS=1`, so the new SQL (`findFloorClearById`, and the aggregate's
   snapshot-ref select replacing its `SELECT *`) is validated against a real DB.
   Both take an id rather than a query object, as `getCharacterFloorClearSnapshot` does.
   Three things came out of building them:
   - **`rank` split off the floor-clear type.** A clear fetched on its own has no board to have a
     rank on, and inventing one would be a placeholder for a meaningless value. So `FloorClear` lost
     `rank` and gained `RankedFloorClear extends FloorClear` (+ `RankedFloorClearEntry` /
     `RankedFloorClearView`); the boards return the ranked one, this query returns the bare one.
     Rank is now applied where a page is formed (`paginate` / `assembleFloorClearPage`) rather than
     inside `assembleFloorClear`. This also deleted a wart: personal-best clears used to carry a
     fake rank that was really a floor-order index, with a comment saying so. `FloorClear` also
     gained its own **`id`**, which boards need to link a row to its page.
   - ⚠️ **`LadderGameRecordAggregate` now carries `FloorClearSnapshotRef`s, not whole snapshot
     records.** It previously `SELECT *`'d `combatant_with_pets` for every character of every clear
     in the game — the largest data in the schema — and nothing that reads an aggregate wants more
     than the id. Same argument as the earlier `FloorClearProjectionRecords.snapshots` change, and
     nothing consumed the blobs (one test reads `.id` / `.partyFloorClearRecord`, both on the ref).
     `FloorClearSnapshotRef` moved to `records/index.ts` so the aggregate can name it without a
     cycle back through the projections module.
   - **View-type overlap collapsed into shared bases, on Mike's push-back.** The first cut restated
     `FloorClearCharacter`'s fields and a subset of `FloorClear`'s. Now:
     `LadderCharacterView<TPlayer>` (who a character is) ← `FloorClearCharacter` (+ the snapshot at
     *this* clear), and `FloorClearDetail` (the clear itself) ← `FloorClear` (+ party/game context)
     ← `RankedFloorClear` (+ rank). `game-record.ts` extends those and declares no field twice.
     The one thing that genuinely isn't duplication: **where the snapshot link lives.**
     `FloorClearCharacter.snapshotIdOption` works on a board because a row *is* one clear; a game
     record lists a party's characters once and each clear has its own snapshot per character, so
     the link sits on the clear as `characterSnapshots` and names the character. Same fact,
     different index, because the nesting differs.
   - `projectGameRecordView` (`queries/game-record-projection.ts`) is the pure assembly, taking the
     aggregate plus a username resolver. It resolves **character owners alongside participants**
     rather than assuming owners are a subset — ownership can change hands when a player abandons.
     `cumulativeTimeToClearFloor` is now exported from the projections module and shared, instead of
     the sum being restated here.
   - Test: `read-queries/floor-clear-and-game-record-by-id-reads.ts`, through a lobby client like
     every other read test. It asserts the standalone clear **equals the board row minus its rank**
     (which is the whole claim: the page reached from a row reports the same numbers, cumulative
     time included), the game record's party/characters/clears against the write-path aggregate,
     that a snapshot link on a clear really fetches, and that both queries return `undefined` for a
     missing id — using a zero UUID, so Postgres treats it as absent rather than malformed.
4. ~~**Progression character by id**~~ — **BUILT 2026-07-26 as `getProgressionCharacter(id)`.**
   Touches saved characters rather than ladder records, so it added **no SQL and no persistence
   method**: it reads the same `findByIds` the experience points ladder hydrates its rows with, which
   is also why it returns `undefined` for an unknown id instead of throwing the way `fetchCharacter`
   does — a url reached from a stale link names a character that may be gone, and that is a page, not
   an error.
   - **The view carries the combatant, not a restatement of it.** `ProgressionCharacterView` is
     `{ ownerUsername, controlScheme, combatantWithPets }` and nothing else: the id, name, classes,
     levels and experience all travel inside the serialized combatant, where every other reader of one
     already looks. Only the two facts the *record* holds and the combatant does not are lifted out.
     Deliberately unlike `CharacterFloorClearSnapshotView`, which restates the name.
   - Inventory is stripped in `progression-character-projection.ts`, from the serialized shape rather
     than by deserializing a combatant to call `deleteAllItems` on it. Capacity and shards stay, as
     they do on a floor clear snapshot — they describe the character, not what it is carrying. Pet
     inventories are stripped too, since pets come along as part of the build.
   - **An owner who no longer resolves reads as missing**, with a `console.info`, matching how the
     ladder page skips the row that would link here. The `lastKnownUsername` fallback cannot help:
     owning a character never made anyone a ladder *participant*.
   - Test: `experience-points/progression-character-page-reads.ts` (that suite, not read-queries —
     nothing here touches a `LadderRecordsPersistenceStrategy`). It needs no game at all: a saved
     character exists the moment it is created in the lobby. The owner's own client is the oracle —
     it holds the same character *with* its inventory, which is what makes "the public view has no
     items" an assertion about stripping rather than about an empty character — and the reader is a
     guest. Absence is covered by deleting the character for real and re-querying, rather than by
     inventing an id that was never issued.

**Possible later: show a floor clear's rank on each board it appears on.** The standalone page has no
rank by design, but a clear has *many* ranks — one per board (floor × mode × control scheme × sort,
plus Deepest Cumulative) — and each one is a `COUNT(*) + 1` of the clears beating it under that
board's filter and ordering. A scan returning one integer, not a materialized board, so the page
could show the whole set rather than any single "the" rank. Pick which boards are worth listing when
we build it; the full cross-product is more counts than anyone wants to read.

Plus, on existing queries:

5. ~~`FloorClearCharacter` gains main/support class and owner~~ — **DONE 2026-07-26.** It is now
   `FloorClearCharacter<TPlayer>` like `FloorClear` itself, since `owner` is an id as persisted and a
   username in the view; `LocalLadderQueries.toFloorClearView` maps it. Owners are always a subset of
   `players` (both derive from the party's characters), so username resolution needed no extra ids —
   an implicit coupling worth remembering if `players` ever stops being derived that way.
6. ~~A sort parameter for the floor-clear tables~~ — **DONE 2026-07-26.** `FloorClearTimesQuery.
   sortOption` = `{ field, isDescending }` (parameter object, not a bare boolean), defaulting to
   `DEFAULT_FLOOR_CLEAR_SORT`.
7. ~~Top-5 summaries for the main page~~ — **DONE 2026-07-27, as a page size on the query.** Not a
   client-side slice of page 0: at a page size of 20 the landing page would fetch 80 rows to show 20,
   and the heavy ones (clear rows carry players + characters) are the ones it would waste.
   - **`PagedLadderQuery` (`{ page, pageSizeOption? }`) in `ladder-page.ts`**, extended by the XP
     ladder, cumulative and floor-clear-times queries, with `pageSizeOf(query)` as the single place
     an unstated size resolves to the default. Everything downstream — rank arithmetic, `totalPages`,
     the sorted-set range read, the SQL `LIMIT/OFFSET` — takes the size from there, so a page is a
     page of the *board* and the two strategies cannot disagree about how big one is.
   - ⚠️ **`LADDER_CONFIG.PAGE_SIZE` is now `LADDER_MAX_PAGE_SIZE`, a plain const.** It is both the
     default and the ceiling: the query arrives from a client we do not control, so the size it names
     is how many rows it can make the server read. Out of range (non-integer, < 1, or above the
     maximum) throws at `validatePagedQuery`, beside the existing page check. The **mutable test seam
     is gone** — it existed only so a test could shrink the page size, and a test can now just ask for
     two rows.
   - **One pagination test, not one per facet** (`read-queries/floor-clear-pagination-reads.ts`): the
     size travels the same path for every board, so it asserts the boundary, rank continuation,
     `totalPages`, an out-of-range page and a too-big size once, on the board whose suite already runs
     against Postgres.

### Read-path performance work (2026-07-26)

Prompted by Mike asking whether materializing every floor clear per request was really something to
defer. It wasn't — "we load the whole table on a single-threaded event loop" is a structural
property, not a guess about traffic, which is a different thing from what the profiler-gated tiering
rule is meant to prevent. Three changes, in ascending order of how much design they cost:

- **Snapshot blobs are no longer loaded to read an id.** `FloorClearProjectionRecords.snapshots` is
  now `FloorClearSnapshotRef` (id + clear + character) and the Postgres loader selects those three
  columns instead of `SELECT *`. That table holds `combatant_with_pets JSONB`, the largest data in
  the schema, and a floor-clear row wants nothing from it but the id. This also fixed the profile
  query's personal-bests path, whose comment claimed it loaded "heavy snapshot blobs only for that
  handful" — it now loads none.
- **Snapshot lookup is a Map, not a scan.** `assembleFloorClearEntry` was doing
  `snapshots.find(...)` per character per row, a full pass over every ref on the board each time.
- **Both boards now filter, order and slice in SQL.** A CTE computes the running total with a window
  function (`SUM(...) OVER (PARTITION BY party_record_ref ORDER BY floor ROWS UNBOUNDED PRECEDING)`),
  and only the page's parties get hydrated afterward. A window beats the lateral-join alternative
  outright here: one ordered pass versus re-summing a party's rows once per row. Rejected:
  denormalizing a `cumulative_time` column, since the window derives it without storing derived data.
  - ⚠️ **Every caller condition is applied OUTSIDE the CTE.** Cumulative time deliberately counts
    floors cleared under the *other* control scheme (a party can switch mid-run), so filtering inside
    the window silently changes what the number means. Mode is safe either way — it lives on the
    game, so it is constant across a party's clears — but it is kept outside for consistency.
  - **Postgres decides order; the shared projection still produces every number.** The new
    `assembleFloorClearPage` assembles in the order handed to it without sorting, and
    `cumulativeTimeToClearFloor` is still summed from loaded history rather than read off the window.
    So the two strategies can only ever disagree about *ordering*, which is precisely what the
    `describe.each` suite checks. **In-memory is now the reference implementation, not a parallel
    copy** — it still uses the sorting projections.
  - Tie-breaks moved from `localeCompare` to ordinal comparison, because Postgres orders ids by their
    own value and locale-aware comparison can disagree on punctuation.
  - ⚠️ **The Postgres strategy is only exercised with `RUN_POSTGRES_LADDER_TESTS=1`.** A default run
    covers in-memory alone, which still takes the old sorting path — so it cannot validate any of
    this SQL. **Run with the flag and green on 2026-07-26**, both strategies, so the window ordering
    is confirmed to agree with the reference implementation.

What is still linear, deliberately: Postgres scans the clear table to compute running totals, and a
running total cannot be indexed. That scan is cheap (a narrow table, in C, inside the database); what
mattered was that it stopped crossing the wire into Node objects.

**Still open:** somewhere to seed test data, so the real frontend has something to display. Its own
session; nothing above depends on it.

---

## Where we are / resume here (2026-07-26) — client read store BUILT, frontend next

**`LadderViewStore` (`client-application/src/ladder-view/`) is the client-side read state.** Six
`KeyedQueryCache` instances, one per query on `LadderQueries`. The old `LadderRecordsStore` is
**deleted** — despite the name it only ever held the user's own game history, and its shape
(`setPage` + a `pagesInFlight` set) was an artifact of the push transport, not of any ladder facet.

- **One entry per distinct query; the key is the whole query.** `(floor, page, controlScheme, mode)`
  for floor clears, and so on. A page is stored exactly as the server assembled it and never rebuilt
  from local records — it *couldn't* be, since `rank` is assigned server-side and the client only
  holds the pages it asked for. `keyOf` is passed per facet rather than stringifying the query
  object, so field order is explicit and a new filter can't silently collide with cached entries.
- **The cache owns the async lifecycle** because the port returns promises: status
  (Loading/Loaded/Failed), rejection capture, `lastUpdatedAt`, and a per-key request-generation
  guard so a slow page 1 resolving after the user clicked page 2 cannot overwrite it. That guard is
  the reason this is one class instead of five `useEffect`s.
- **No eviction, no current-selection state.** The URL is the source of truth; the route component
  derives the query object and calls `request(query)` (cache-first) or `refresh(query)` (always
  fetches, behind the refresh button). Entering a URL fetches fresh with no special casing, because
  a full page load starts with an empty cache. A *failed* entry counts as asked — retry is the
  button's job, or a render loop would hammer an already-failing server.
- ⚠️ **mobx: `stateByKey` is `observable.shallow`, and the injected `fetchResult`/`keyOf` are
  `false`.** Both are TS parameter properties, so mobx sees them as own fields holding functions and
  would infer `autoAction` — wrapping another subsystem's bound method, and putting a batch around
  an async function whose every state write happens after the first `await` anyway (the real actions
  are `beginRequest`/`receiveResult`/`receiveFailure`). Deep observability was measured to re-proxy
  every stored page and break value identity; shallow keeps the map reactive and stores pages as
  sent. Note `autoAction` does **not** untrack reads inside a derivation — a method like `get()`
  being an action is harmless (verified against mobx 6.15).

**User game history folded into `LadderQueries` and made public (2026-07-26).** It was always meant
to be part of the profile page. `getUserGameHistory({ username, page, dateRangeOption })` is a sixth
query, implemented like `getPlayerProfile` (`findUserIdByUsername`, then the page); an unknown
username returns an **empty page**, not a second `NoSuchPlayer` union, since the profile query
rendered alongside it already drives the 404. Deleted: `ClientIntentType.GetUserGameHistory` and
`GetUserGameRecordsCount`, `GameStateUpdateType.UserGameHistoryPage` and `UserGameRecordsCount`,
both controller handlers, and the update-handler push. `LadderPage.totalPages` subsumes the separate
count intent, so the read is now **one round trip instead of two**.

- Nothing in the entry was ever viewer-relative — both persistence impls filter by one `userId` — so
  `fateOptionOfQueryingPlayerParty`/`queryingPlayerAbandonedAtOption` became `partyFateOption`/
  `abandonedAtOption` and `UserGameHistoryEntry` moved to `queries/user-game-history.ts`. No SQL
  changed. **`LadderQueries` stays uniformly public**, so `executeLadderQuery` never needs caller
  identity.
- The three tests that read the old store (`abandon-run-updates-ladder-records.ts`,
  `save-game-record-on-start.ts`) now go through `createLadderViewerQueries()` like every other read
  test; `requestGameHistory` is gone from the harness.

**Perf finding, deliberately NOT acted on.** `getUserGameHistory` is the only query that runs a
`COUNT(*)` — and the only one that paginates in SQL. The others skip counting only because they
already materialized everything: `getFloorClearTimes` loads every party that ever cleared the floor
plus their clear history, and `getWinRateLadder` loads **every ranked race game ever**, all their
parties, all their characters, and the whole participant table, then slices in memory. That's the
naive tier working as designed; leave it until a profiler says otherwise.

**Next: the JSX.** Step 6 (faceted ladder view) and step 7 (`/profile/:username`). No frontend route
exists yet — nothing under `frontend/src/app` references the ladder.

---

## Where we are (2026-07-25, later)

**Step 8 (XP ladder) is BUILT — not yet run.** The facet now has a real data source and a client read
path. Shape:

- **One sorted set per control scheme, and no combined ladder.** `experiencePointsLadderName(scheme)`
  in `servers/services/ranked-ladder.ts` is the only way to name a ladder; the bare prefix const is no
  longer exported. A cross-scheme "total" board was considered and dropped — PoE/Diablo keep their
  ladders separate, and the schemes play differently enough that one ranking across them means
  nothing. Every write/read/removal therefore carries a `CharacterControlScheme`, which is always at
  hand (`game.characterControlScheme` in the policies, `character.controlScheme` on the saved-character
  record in the delete handler).
- ⚠️ **The Valkey key prefix changed** (`character-level-ladder:` → `experience-points-ladder:`, plus
  a per-scheme suffix). Old keys just orphan in Valkey; `loadLadderIntoKvStore` rebuilds the new ones
  from Postgres at lobby boot, so no migration, per the pre-release rule.
- **Renamed off the stale "level" vocabulary** (2026-07-25): `CharacterLevelLadderService` →
  `ExperiencePointsLadderService` (+ the `InMemory…` / `Database…` implementations and the
  `experiencePointsLadderService` field everywhere it is injected),
  `updateOrCreateCharacterLevelEntry` → `updateOrCreateCharacterExperienceEntry`, and the files
  `servers/services/ranked-ladder.ts` → `experience-points-ladder-service.ts`,
  `in-memory-ranked-ladder-service.ts` → `in-memory-experience-points-ladder-service.ts`,
  `server/game-node/services/ranked-ladder.ts` → `experience-points-ladder.ts`. Nothing ranks by
  level anymore, so nothing should be named for it.
- **`ExperiencePointsLadderService` is now primitives + policy.** Abstract: `getCurrentRank`,
  `setScore`, `removeEntry`, `getRankedPage` (the new range read). Concrete on the base:
  `updateOrCreateCharacterLevelEntry` (brackets the write with two rank reads) and
  `removeDeadCharacters`. Both implementations are thin, so in-memory stays a faithful oracle for
  Valkey — including tie ordering, where in-memory now breaks score ties in reverse-lexicographic
  member order to match `ZREVRANGE`.
- **Bug found doing it:** the Valkey `updateOrCreateCharacterLevelEntry` returned `zAdd`'s result as
  `newRank`. `zAdd` returns *how many members were added* (0 when updating an existing one), not a
  rank — so every rank-up message on the deployed server computed a rank of 0 or 1. In-memory computed
  it correctly, which is why the ladder tests never caught it. Both now go through `zRevRank`.
- **The read is a join of two stores, not a mirror of one.** `getExperiencePointsLadderPage` on
  `LadderQueries`: the sorted set says *who is ranked and in what order*, and every displayed figure
  (name, class, level, level progress, total XP) is read back off the **saved progression character**
  via the new `findByIds` on `SavedCharacterPersistenceStrategy`. Nothing is denormalized, so a row
  cannot disagree with the character its owner logs in to. `projectExperiencePointsLadderPage`
  (`ladder/queries/experience-points-ladder-projection.ts`) is the pure assembly, deriving rank the
  same way the records-side `paginate` does (`page * PAGE_SIZE + index + 1`).
- **`ExperiencePointsLadderCharacterEntry` and the `LadderCharacterRecord`-based read are gone** — the
  wrong-source implementation the earlier note flagged. Saved characters are the source now.
- **A ladder entry that cannot be hydrated is skipped and `console.info`d.** Two ways it can happen —
  the saved character is missing (the sorted set outlived what it ranks), or its owner no longer
  resolves at the identity provider (an externally deleted account, the orphan case noted below).
  Dropping the row rather than `invariant`ing means one orphan can't take down a page everyone can
  see; the log line is how we find out it is happening at all. Ranks keep their sorted-set positions,
  so a skipped row leaves a visible gap.
- **Tests: `integration-tests/src/ladder/experience-points/` — 8 green (2026-07-25).** Its own suite,
  not parametrized over the ladder-records strategies (this facet never touches one). The old
  `ladder/index.test.ts` (rank-up / death / delete *message* tests) moved in here too, split into
  per-concern files behind one `index.test.ts`, since they were always XP-ladder tests. New: read-back
  of a real battle's XP, the two schemes ranking separately, and death removing a ranked character.
  - ⚠️ **A player character does not own `CombatActionName.Death`** (it exists for engine-triggered
    deaths, and is not in a character's `ownedActions`), so `useCombatAction(Death)` is a silent
    no-op — it looked like a targeting problem but the action never resolved. Killing a test character
    still means walking a 1hp fixture into a lair and passing the turn, as the older death tests do.
- Fixture: `ClientTestFixtureOptions.controlScheme` now threads through
  `createSingleClientWithSavedCharacters` / `createSingleClientInProgressionGame`, which were both
  hardcoded to Captain.

**Validated: the full suite is green (2026-07-26).** With this, every backend increment of the
rebuild is done — all four facets have a data source, a read path, and tests. **What is left is the
frontend**: step 6 (the faceted ladder view) and step 7 (`/profile/:username`). Step 4 (IndexedDB for
offline) is still open but reduced in scope, per the offline finding below.

---

## Where we are (2026-07-25)

**Step 5 (socket wiring for `LadderQueries`) is DONE and validated.** Committed as `c90e816c`
(client-side queries) and `bc29b39d` (username on participant records); migrations run and the whole
read-query suite green with all six tests asserting on client output. The online read path exists end
to end:

- **`UsernameDirectory`** (`common/src/servers/services/username-directory.ts`) — new port for looking
  up names of *arbitrary* users (`resolveUsernames(ids)`, `findUserIdByUsername`).
  `IdentityProviderService` only resolves the identity behind the connection being served, which is
  not what a read model needs. Implemented by `InMemoryIdentityProviderQueryStrategy` (it already owns
  the id↔username map, so it now implements both interfaces) and by
  `AuthServerUsernameDirectory` in `server/src/services/`, which wraps the pre-existing
  `getUsernamesByUserIds` / `getUserIdsByUsername` auth-server fetches (they were dead code until now).
  Injected via `LobbyExternalServices.usernameDirectory` (wired in lobby-node, the test fixture, and
  the offline server factory).
- **`LocalLadderQueries`** (`common/src/ladder/queries/local-ladder-queries.ts`) — implements
  `LadderQueries` in-process over `LadderGameRecordsService` + the directory. This is the Entry→View
  seam: resolves `IdentityProviderId` → `Username` and derives `winRate`. The server runs it for a
  connected client; an offline client can run it directly (see the offline finding below).
- **`LadderQueryType` / `LadderQueryRequest` / `LadderQueryResult` + `executeLadderQuery`**
  (`ladder/queries/ladder-query-messages.ts`) — `LadderQueries` expressed as messages, so all four
  calls travel as ONE intent type (`ClientIntentType.LadderQuery`) and ONE reply update
  (`GameStateUpdateType.LadderQueryResult`) instead of four of each.
- **`ClientLadderQueries`** (`client-application/src/client-ladder-queries.ts`) — implements
  `LadderQueries` by dispatching to whatever server the client is connected to, over whatever endpoint
  that is; owns all reply bookkeeping (a `Map<intentSequenceId, {resolve, reject}>`). The lobby update
  handler hands it results; `waitForServerReply` is used only to detect "stream ended with no result"
  → reject with the recorded error. Exposed as `clientApplication.ladderQueries`. Pending queries are
  failed on reconnect (see below). Named for its *role*, not the topology — "Remote" was wrong offline,
  where the LobbyServer is in-process behind an in-memory endpoint.

**Design decision — reply updates carry the intent id; correlation is never inferred from order.**
`GameStateUpdateType.LadderQueryResult` implements the new **`ClientIntentReply`** interface
(`{ clientIntentSequenceId }`) in `packets/game-state-updates.ts`, which names the concept: *an update
that answers one specific client intent rather than pushing state at whoever is listening*. Only such
updates carry the id — ordinary pushes stay as they are (`ErrorMessage` and `EndOfUpdateStream` happen
to carry the same field but were deliberately left alone for now). Server side, the handler stamps
`session.currentIntentSequenceId`, a new getter aliasing `lastIntentHandledId` (the server increments
it *before* dispatching, so inside a handler it is that handler's own intent — the old name reads as if
it were the previous one).

Why this was never needed before: **no previous read returned a value to its caller.** The old reads
(`UserGameHistoryPage`) push into an observable store whose key comes out of the payload itself
(`setPage(data.page, …)`), so "which request does this answer?" was never asked, and
`waitForServerReply` only ever meant "the server is done with my intent". A promise-returning port
changes that — a promise must settle with exactly one value belonging to exactly that call. Sequential
server processing gives **ordering, not identity**: FIFO attribution almost works, but breaks on
failure, because an errored query emits an error message and *no* result, after which the next
stream's result is handed to the request that already failed. Ordering cannot distinguish "no answer
yet" from "no answer coming".

**Unresolvable username is an INVARIANT, not a fallback.** Every participant id resolves either at the
identity provider or, for a deleted account, from `LadderParticipantRecord.lastKnownUsername`.
`LocalLadderQueries` consults the directory first, then the participant record, then `invariant`s — no
"[unknown]" placeholder, because a placeholder would imply a reachable state that must not be.

**The write-path gap is CLOSED (2026-07-25) — refresh on lobby connect.** Renamed
`usernameAtTimeOfAccountDeletion` → **`lastKnownUsername`**, because it is now kept current for live
accounts and merely *becomes* the deletion-time record once the id stops resolving. Mechanism: every
time an authed session is created, `LobbyServer.connectionHandler` calls
`ladderGameRecordsService.refreshParticipantUsername(id, username)` — right beside the existing
`createProfileIfUserHasNone`. A rename therefore takes effect on the player's next connect; compliant
clients reconnect after a rename, and a non-compliant one just keeps a stale name on file until it
does, which is an acceptable degradation. Two supporting rules:
- **`recordNewGame` stamps the name** when it creates the participant record (it already has
  `usernamesToAuthIds`), so a player's first game doesn't leave a null until their next connect.
- **`refreshParticipantUsername` is UPDATE-only, never an insert.** Only players with ladder history
  get a participant record; connecting alone must not create one. That is precisely what makes the
  profile lookup below able to tell "never played" from "doesn't exist".
- ⚠️ **The column rename edited the existing migration in place** (`20260612000000_ladder_records.cjs`,
  `username_at_time_of_account_deletion` → `last_known_username`) rather than adding a rename
  migration, per the pre-release "no migration code for unreleased features" rule. **A dev DB created
  before this needs a `migrate down` + `up`.** The Testcontainers pg tests build from migrations fresh,
  so they are unaffected.

**Player profile distinguishes "no such player" from "never played" (2026-07-25).**
`getPlayerProfile` returns a **`PlayerProfileLookup`** union (`player-profile.ts`): `NoSuchPlayer` when
the username resolves to nobody at the directory, or `Found` with a `PlayerProfileView` — including an
*empty* one (zeroed record, no bests) for a real user with no participant record. Modelled as a typed
result rather than a thrown error so the UI can render a proper 404 page: a throw would arrive as an
`ErrorMessage`, and `BaseClient.handleErrorMessage` pops a global alert toast for those, which is wrong
for "that player doesn't exist".

**Test status — all six read-query tests assert on client output, all green.**
`ironman-floor-clear-reads.ts` was converted and confirmed first; the other five followed via the
shared `createLadderViewerQueries()` helper (details in the resolved-stopgap note further down). Every
ladder read under assertion is now a client's, over the socket, returning Views.

**Failure paths now covered — and covering them caught a real bug (2026-07-25).**
`ClientLadderQueries` destructured `clientApplication.errorRecordService` in its constructor, but it
is built as a `ClientApplication` field initializer (`index.ts:71`) and `errorRecordService` is
declared below it (`:81`), so it captured `undefined`. Every errored query then threw a `TypeError`
inside `failIfStillPending` and **hung its caller forever instead of rejecting** — the entire
reject-on-error path was dead. Fixed by holding the `clientApplication` and reading through it at call
time, which is what every other subsystem constructed with `this` already does. New tests in
`integration-tests/src/ladder/query-transport/` (own directory, not parametrized over postgres — they
never reach a persistence strategy):
- `server-error-rejects-query.ts` — a server-side throw rejects the caller **with the server's own
  message** (proving the error was matched to that intent, not a generic timeout), then a follow-up
  query returns normally, proving the failure left no stale pending entry for a later reply to be
  misattributed to. That second assertion is the exact failure mode FIFO ordering cannot prevent.
- `reconnect-fails-pending-queries.ts` — pauses the client transport so the reply is produced but
  never delivered, reconnects, and asserts the stranded query rejects rather than hanging or being
  answered by a reused intent id.

**Deleted-account read path covered (2026-07-25).** `read-queries/deleted-account-username-reads.ts`
(runs against both strategies, so it exercises the real `last_known_username` column): plays an
Ironman run, deletes the identity, asserts the directory has genuinely forgotten the id — otherwise
the test would pass without the fallback ever firing — then that the floor-clear row still shows the
old username while `getPlayerProfile` on that name returns `NoSuchPlayer`. Needed a new
`deleteIdentity(authSessionId)` on `InMemoryIdentityProviderQueryStrategy` (drops both the session and
the identity, mirroring the existing `changeUsername` test seam). Verified this is a faithful
simulation: nothing in this repo handles deletion at all, and `AuthServerUsernameDirectory` surfaces a
deleted user as an **absent map key**, exactly like the in-memory one — which is the signal
`resolverForPlayers` keys its fallback off.

**Offline finding that changes step 4's shape.** Offline mode already constructs a **real `LobbyServer`
over the in-memory transport** (`client-application/src/connection-topology/create-offline-servers.ts`),
so the earlier "offline reads never touch a wire" premise is not how offline actually runs today.
`ClientLadderQueries` therefore works offline as-is, and step 4 may reduce to *just* an IndexedDB
`LadderRecordsPersistenceStrategy` — no second `LadderQueries` implementation, no impl selection on the
client. Confirm when building it.

Also cleaned: `getExperiencePointsLadder` removed from the `LadderQueries` interface (it had no data
source; step 8 re-authors it along with `experience-points-ladder.ts` and
`ExperiencePointsLadderCharacterEntry`, which remain unreferenced for now), plus the four leftover
unused imports of that Entry type. `winRateOf` is now exported from the projections module so View
assembly and ladder sorting share one formula.

---

## Where we were (2026-07-24)

Read increment (step 3) is **done and validated**: persistence read methods (in-memory + naive
Postgres) over shared projections, and a **passing** Ironman integration test
(`integration-tests/src/ladder/read-queries/`) proving the write→read→projection path against real
records. Read queries are surfaced as passthroughs on `LadderGameRecordsService`.

**`RankedRaceModeLadderPolicy` is now implemented** (2026-07-24) — race writes ladder records, so the
win-rate / race-floor-clear / race-profile facets finally have a data source. Implemented as a
multi-party mirror of `IronmanModeLadderPolicy` (`recordNewGame` on start; aggregate update +
per-party floor-clear on descent; aggregate update on escape/battle-victory). See session log for the
one non-obvious wrinkle (the detached-party wipe on solo leave).

**Race read-query integration tests** (`integration-tests/src/ladder/read-queries/`):
- `ranked-race-win-rate-reads.ts` — two-party ranked race, both escape (alpha before bravo via a clock
  advance between escapes), asserts `getWinRateLadder` / `getPlayerProfileData` win-loss split +
  `getFloorClearTimes`. **GREEN (validated 2026-07-24).**
- `ranked-race-solo-leave-loss-reads.ts` — two-party ranked race, bravo (solo party) leaves → their
  party is detached before the wipe; asserts the `updatePartyFate` guard still records the loss
  (`{ wins:0, losses:1, gamesPlayed:1 }`). **GREEN (validated 2026-07-24).**
- `ironman-filters-and-snapshot-reads.ts` — single Ironman run; asserts `getFloorClearTimes` mode +
  control-scheme filters (match vs exclude) and `getCharacterFloorClearSnapshot` hydration. **GREEN
  (validated 2026-07-24).**
- `floor-clear-pagination-reads.ts` — three independent single-player Ironman runs (one per user,
  PLAYER_1/2/3), page size shrunk via the new `LADDER_CONFIG.PAGE_SIZE` seam; asserts full page +
  partial page, rank continuation across the boundary, `totalPages`, and an out-of-range page.
  **GREEN (validated 2026-07-24).** (`LADDER_PAGE_SIZE` const → `LADDER_CONFIG.PAGE_SIZE` mutable
  object, mirroring the `GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE` test seam; only the projection
  consumed it. Confirms three game-server games can run concurrently under fake timers.)
- `ironman-multi-run-personal-best-reads.ts` — one player plays two Ironman runs, each clearing floor
  1 at a different time; asserts `getPlayerProfileData` dedupes to a single floor-1 personal best at
  the faster time. **GREEN (validated 2026-07-24).** Uses the extracted
  `driveClientIntoSinglePartyGameServerGame` (leave saves run 1 → 1 of 2 slots → play run 2). Note:
  leaving a solo Ironman run SAVES it (holds a slot); only a *concluded* run (escape/wipe/abandon)
  frees the slot — two saved runs sit exactly at the cap of 2, which is fine.

The race write path (`RankedRaceModeLadderPolicy`) is now implemented AND covered by green integration
tests (escape-winner, win/loss split, and the solo-leave detached-party guard). The win-rate,
race-floor-clear, and race-profile facets have a validated data source.

**Fixture-helper shape (2026-07-24):** the game-server-setup ceremony is now `createClient` +
`driveClientIntoSinglePartyGameServerGame` (public, reusable across sequential games on one client,
**guards single-party modes only** — race must use the two-client helpers). `createSingleClientInGameServerGame`
wraps those two.

**Read-query coverage is COMPLETE at the read-model level (all green, 2026-07-24):** floor clears +
cumulative + profile bests, race win/loss + earliest-escape winner, solo-leave detached-party guard,
mode/control-scheme filters + snapshot hydration, pagination, and multi-run personal-best dedup.
`getExperiencePointsLadderCharacters` was **removed from the service (2026-07-24) to be rebuilt fresh**
in the XP re-keying work (step 8) — it was implemented wrong (read `LadderCharacterRecord`s; see the
XP-ladder facet section). The correct build ranks the **real progression-mode characters by their
experience points**.

> ✅ **RESOLVED 2026-07-25 — all six now assert on client output**, so the stopgap warning below is
> historical. Each test reads through `LadderQueries` on a client via the new fixture helper
> `createLadderViewerQueries()` (a **guest** in the lobby by default — nobody has to be logged in to
> browse a ladder, and in the pagination test all three auth identities are busy playing). The
> multi-run test instead reads through `alpha`'s own client, which is back in the lobby after leaving
> run 2, covering "my own profile". `testFixture.ladderGameRecordsService` still appears in four of
> them, but only as `requireGameRecordAggregate` for ground-truth expectations — the write path's own
> record is the oracle, which is the point. Assertions moved from Entries to **Views**: usernames
> instead of `IdentityProviderId`s, `record`/`rankedRaceRecord` (with the derived `winRate`) instead of
> raw tallies. `requireOwnerId` / `requireCharacterRecord` in `aggregate-lookup.ts` died with the
> id-keyed assertions and were deleted.
>
> ⚠️ **HISTORICAL (2026-07-24): these read-query tests were a STOPGAP.** They
> assert against `testFixture.ladderGameRecordsService` (the server-side read methods) directly, because
> there's no client path to request ladder records yet. The real goal (per the assert-on-client-output
> rule, [[feedback_integration_tests_assert_client_output]]) is to drive a **client** query over the
> socket and assert on **`clientApplication` state** — that the player actually sees the records they
> asked for. That needs the `LadderQueries` socket wiring (steps 5-6), which doesn't exist yet. **When it
> lands, revisit ALL of these (both the in-memory and postgres params) and re-point them at
> client-observed output.** The current tests still have value in the meantime (they validate the
> projection + SQL), but they are not the final shape.

**Postgres-backed read-query test — GREEN 2026-07-24.** All 12 pass (6 in-memory + 6 postgres). The
previously-UNVERIFIED Postgres read SQL is now validated against a real DB (Testcontainers). Parametrized
the read-query suite over `{ in-memory, postgres }` via `describe.each` (mirrors the auth/guest pattern in
`game-server-reconnection/index.test.ts`). Both strategies run the SAME six tests through the same
`LadderGameRecordsService`, so in-memory doubles as an oracle for the Postgres SQL.

Two non-obvious things surfaced getting it green (both fixed):
- **Fake timers deadlock Testcontainers startup.** A prior in-memory test leaves `vi.useFakeTimers()`
  installed; `container.start()` (and pg queries in migrate) are timer-driven and hang forever. Fix:
  `testFixture.timeMachine.returnToPresent()` before every container-lifecycle op (start/truncate/stop)
  in the pg block's hooks. NOTE: pg *queries during a test* are fine under fake timers (they resolve on
  socket I/O, which fake timers don't touch) — only container startup/migrate needed real timers.
- **UUID columns vs the harness's sequential ids.** Prod ids come from `IdGeneratorRandom` (uuidv4), and
  the schema id columns are UUID; the test harness swaps in `IdGeneratorSequential` (`"lid-1"`, `"eid-N"`)
  for determinism, which isn't valid UUID → `22P02`. Fix: the pg run injects `() => new IdGeneratorRandom(...)`
  via the new `idGeneratorFactory` seam (safe here — no read-query test depends on turn-order determinism;
  they use no-combat dungeons). Participant id is INT and the test identity provider issues numeric ids
  (`getNextIdNumeric`), so that column was already fine.
- Infra: `@testcontainers/postgresql` spins up ephemeral `postgres:16`; `node-pg-migrate` runs the
  real `.cjs` migrations programmatically against it (explicit `databaseUrl`, never touches the dev
  `.env`). `packages/integration-tests/src/fixtures/postgres-test-database.ts` owns container lifecycle
  + `TRUNCATE ... RESTART IDENTITY CASCADE` between tests.
- Wiring: `createTestServers` / `IntegrationTestFixture` now take a `ladderPersistenceStrategyFactory`
  (defaults to in-memory); the pg param passes `() => new DatabaseLadderRecordsPersistenceStrategy()`.
  Server barrel now exports `pgPool`, `DatabaseLadderRecordsPersistenceStrategy`, `RESOURCE_NAMES` (the
  strategy uses the `pgPool` singleton, which the harness connects to the container).
- **Gated behind `RUN_POSTGRES_LADDER_TESTS=1`** so the default suite stays fast + Docker-free; the pg
  block (and its container) only exists when the flag is set. Run:
  `RUN_POSTGRES_LADDER_TESTS=1 yarn workspace @speed-dungeon/integration-tests test read-queries`.
- ~~Minor cleanup still open: `node-pg-migrate` works from integration-tests via yarn hoist but isn't
  declared there~~ — declared 2026-07-25, **pinned to `7.7.1` to match the server**. It must not float:
  a `^9.0.0` range hoists v9 over the server's 7.7.1 and v9 changed the default export, so
  `import migrate from "node-pg-migrate"` dies with `TypeError: (0 , default) is not a function` and
  the whole postgres block fails before any test runs. Declaring the exact version leaves `yarn.lock`
  byte-identical, which is the sign it is a declaration and not a version bump.
  - Unrelated environment trap hit while reinstalling: `yarn install` fails on
    `undici@8.9.0 … Expected version ">=22.19.0". Got "22.14.0"`. That undici is already in the
    committed lockfile, so this bites any install on this node version — use `--ignore-engines`.

**Next:** steps 6 (faceted UI) and 7 (profiles), which now have a working read path to build on. Step 4
(IndexedDB) is reduced in scope per the offline finding above; step 8 is XP re-keying, including
rebuilding the removed XP-ladder read.

**Known open loose ends (none blocking step 6):**
- ~~Dead XP-ladder types awaiting step 8~~ — `queries/experience-points-ladder.ts` was rewritten and
  is live; `ExperiencePointsLadderCharacterEntry` was deleted (2026-07-25).
- `frontend/src/app/lobby/user-menu/index.tsx:170` still routes to `/profile/:username`, which 404s
  until step 7.
- Deferred write-path items: the owner-at-clear-time `IdentityProviderId` denormalization and the
  game-history facet.

---

## Goal

Replace the old experience-points ladder frontend with a client-rendered, faceted view over the
new `ladder-records` data, plus rebuilt player profiles. Backend records model is already good and
stays; the frontend was old, tied to dead REST endpoints, and used SSR we no longer want.

Why SSR is gone: the original point was Discord link previews auto-reflecting current ladder state.
Not worth the complexity. Clients render it now — their CPU, not ours, and simpler. If truly public
/ anonymous shareable ladder URLs ever come back, that's when REST gets revisited.

---

## Decisions locked

**Transport: websocket, everywhere online.** The socket already supports request/reply — per-connection
intent IDs tracked server-side, client increments on send, so a specific message's reply can be
awaited. That covers call-and-return lookups (including other players' profiles). It also allows a
live-updating ladder via server push, which REST can't do without polling.

**Client abstraction: a `LadderRecordsGateway` query port.** Consumers never know the source.

- Online impl → socket request/reply via intent IDs.
- Offline impl → direct in-process call into an IndexedDB-backed persistence strategy. **No transport
  at all offline** — this is the key point; there's no need for an in-memory HTTP shim, because
  offline reads never touch a wire.

**Storage: keep the existing `LadderRecordsPersistenceStrategy` seam.** In-memory + Postgres exist.
Add an IndexedDB implementation for offline stat persistence.

**No SSR / RSC.** Plain client-rendered mobx views. Keep the old Tailwind table styling — it was good.

**The world XP ladder stays.** It is meaningful and live: characters are not bound to dungeons
(Diablo-style — take a character floors 1-4, leave, join another game with it), so "highest level
character in the world" is a real global ranking. It remains its own service
(`CharacterLevelLadderService`, sorted-set), surfaced as one facet — NOT folded into the relational
ladder-records store.

---

## The four facets

1. **World XP ladder** — global character level/exp ranking.
2. **Floor clear times** — fastest party times, sliced by mode x control scheme x floor.
3. **Party victories** — race winners / escapes.
4. **Player profile** — personalized aggregate, own _and_ other players'.

### XP ladder — re-keyed 2026-07-25 (step 8, see top)

Was a single sorted set with no control-scheme dimension. Now one set per scheme, named by
`experiencePointsLadderName(scheme)`.

- ~~An all-up "total" ladder across all players regardless of mode.~~ **Dropped** — separate ladders
  only, as PoE and Diablo do it.
- ~~Every row carries mode and control scheme as context columns.~~ **Dropped**: only progression
  characters are ranked, so mode is a constant, and the control scheme is the board you are looking
  at rather than a column on it.

> ✅ **RESOLVED 2026-07-25 — rebuilt over saved progression characters (see the entry at the top).**
> The historical note below explains why the old one was wrong.
>
> ⚠️ **The XP-ladder read was REMOVED from the service (2026-07-24), to be built fresh in step 8.**
> `getExperiencePointsLadderCharacters` was gone-wrong: it read `LadderCharacterRecord`s — but those
> exist only to show basic character info *within an ironman/race game record* (name/class for a
> floor-clear row); they are NOT the XP ladder's source, and ironman/race characters don't belong on the
> XP ladder at all. The correct build ranks the **real progression-mode characters by their experience
> points** — source of truth is the actual progression character entities + the `CharacterLevelLadderService`
> sorted set, hydrated from the live character, not a `LadderCharacterRecord`. (Same "hydrate from the
> real entity, don't mirror it into a denormalized record" point, made concrete.)
> Remnants still lingering to clean when rebuilding: the `LadderQueries.getExperiencePointsLadder`
> interface method, the `ExperiencePointsLadderCharacterEntry` type, `projectExperiencePointsLadderCharacters`,
> and the two strategy implementations (in-memory + Postgres) — all dead until step 8.

Offline nuance: a _world_ ladder has no meaning with no world. Offline, this facet either hides or
degrades to the local player's own characters. Decide when we build it.

### Profiles — a personalized read, not a port of the old page

Aggregate over the ladder-records data, computed per player:

- Race wins / losses / win rate.
- Personal-best floor clear times, by game mode **and** control scheme.
- A view of their characters (build snapshots) at those best floor clears.

Win/loss derives from `LadderPartyRecord.fateOption` plus escape ordering on race-mode games — only
races have a winner, per the note in `ladder-records/index.ts`.

Players will absolutely browse _other people's_ profiles ("damn, that person is good"), so
profile-by-arbitrary-user is a first-class path, not an edge case. This is why call-and-return
matters and why the intent-ID reply mechanism is load-bearing.

---

## The actual work: new read queries

The records model is rich but its read surface is tiny. Today only:
`getUserGameHistory`, `getUserGameRecordsCount`, `findGameRecordAggregateById`.

There are **no cross-user / leaderboard queries at all**. That is the bulk of the remaining work.

Two layers:

- **`LadderQueries`** (client-facing read side, CQRS-style) — `common/src/ladder/queries/`, types-only,
  written 2026-07-24. NOT called "gateway" — verified against Fowler's catalog: Gateway means "wrap
  access to an external resource" (a data-access pattern, fits the *persistence* layer), and it
  collides with our existing connection-gateway. This is the query side returning **View** data.
  Speaks `Username`, **never `IdentityProviderId`** (the client must not see the internal id).
  Methods: `getExperiencePointsLadder`, `getFloorClearTimes`, `getWinRateLadder`,
  `getCharacterFloorClearSnapshot`, `getPlayerProfile(username)`.
- **`LadderRecordsPersistenceStrategy`** (backend) — the actual queries, still to be added, implemented
  across in-memory / Postgres / IndexedDB.

Naming convention: inputs are `…Query`, display outputs are `…View` (pure data, no methods/JSX — that
is what keeps them distinct from a rendered React view). Files split one-per-use-case under
`ladder/queries/`: `ladder-page`, `experience-points-ladder`, `floor-clear-times`, `win-rate-ladder`,
`player-profile`, `character-floor-clear-snapshot`, `ladder-queries` (the interface). Each exported
individually from `common/src/index.ts`.

Why CQRS-lite is warranted (we weighed it rather than adopting it by reflex): we take only the light
half — read queries return View DTOs distinct from the written record shapes — NOT the costly half
(separate read store / projections / eventual consistency). Justified because the reads genuinely
diverge from the writes here (XP ladder joins two stores + resolves id→username; win rate is a derived
aggregate; floor-clear rows are denormalized joins), AND because we need one interface over two
implementations (socket online / IndexedDB offline), which warrants the port regardless of CQRS.

Shape decisions baked into the queries:

- Ranked by **experience points, not level** (1-10 is too coarse). Main class carries experience;
  support class is flat level only (no XP) but still shown. XP score comes from
  `CharacterLevelLadderService` joined to `LadderCharacterRecord` on `CombatantId`.
- **"Floor clear times", not "fastest"** — all clears for the filter, sorted fastest-first by default.
  Race + ironman only; progression does not record them. Rows carry party name, date, players,
  character names, and a `snapshotIdOption` per character to drill into the build snapshot.
- Win-rate query takes a **`minimumGamesPlayed`** floor so a 1-0 player doesn't sit at 100% forever.
- Names avoid "Highest" — a row shouldn't bake in a sort order. Profile reuses `FloorClearEntry` for
  personal bests, no separate shape.

Control scheme is a **filter column**, not separate tables — the records already carry
`controlScheme` on both game and floor-clear records. (Matches the conclusion already in
`ladder/records/notes.ts`.)

---

## Increment plan

1. ~~Teardown~~ — done 2026-07-23, see log below.
2. ~~Read-model seam~~ — `LadderQueries` interface + `…Query`/`…View` types written 2026-07-24
   (`common/src/ladder/queries/`). Query method signatures on the persistence strategy still TODO —
   deferred so its two live implementers (in-memory + Postgres) don't go red before step 3.
3. Implement the queries — in-memory first (cheapest to test), then Postgres. **Persistence read
   methods DONE 2026-07-24** (in-memory + naive Postgres). See session log below. Testing: see
   "Testing strategy" below — integration-first over pure-unit, Ironman now, race deferred.
4. IndexedDB strategy for offline.
5. ~~Wire the online gateway impl over socket request/reply~~ — done 2026-07-25 (see top).
6. Build the faceted view UI, reusing the old Tailwind table styling.
7. Rebuild profiles at `/profile/:username` (client-rendered).
8. ~~XP ladder re-keying for control scheme~~ — done 2026-07-25 (see top); no total view, by decision.
9. _Optional phase 2:_ live-updating ladder via server push. Needs subscription bookkeeping (who is
   watching which facet) and throttling — do not push on every XP tick. Explicitly NOT baseline.

---

## Testing strategy (decided 2026-07-24)

**Integration-first, not pure unit tests.** Hand-built record fixtures encode our assumptions about
record shapes and drift from what the real write path produces; integration tests that actually play
runs exercise write→read together and catch that whole class of bug. So: drive real gameplay through
`IntegrationTestFixture` (see `ladder/game-records/save-game-record-on-start.ts` for the pattern —
create client, `createGame(name, GameMode.Ironman)`, character, ready, transition to game server),
then assert on the read queries. Reads currently have no client path (LadderQueries socket wiring is
steps 5-6), so assert via `testFixture.ladderGameRecordsService` / the strategy directly for now —
upgrade to client-driven (per the assert-on-client-output rule) once that wiring lands.

- **Write tests mode-agnostically where possible.** Ironman and race share most of the record shape
  and flow, so structure the play-a-run-then-read helpers to be reused for race once its write path
  exists.
- **Race write path is now IMPLEMENTED (2026-07-24)** — `RankedRaceModeLadderPolicy` is filled in
  (see session log). Ranked race now writes ladder records, so the win-rate, race floor-clear, and
  race-profile facets have a live data source. The **race integration test is the recommended next
  step** and is no longer blocked; it should drive a multi-party game to exercise winner resolution
  (earliest escape) and the solo-leave wipe path.
- **Edge cases that gameplay can't naturally produce — deferred, noted:**
  - *Earliest-escape tie* (two parties escaping at the exact same ms): may not even be reachable in
    practice. If we ever need to cover it, force it with a controllable-clock ("time machine") test
    fixture. Not worth chasing now.
  - *Missing-floor cumulative gap* (a party missing an earlier floor's clear record): treated as an
    **invariant** — if it happens, a floor clear went unrecorded, i.e. a write-path bug. The read
    just sums whatever floors exist (graceful undercount) rather than throwing; we don't expect it.

## Teardown log — 2026-07-23

Deleted (frontend):

- `frontend/src/app/ladder/` — the whole old XP ladder route. `ladder.tsx` was already returning
  "not implemented" with the real code commented out; `page.tsx` was an SSR/Suspense wrapper.
- `frontend/src/app/profile/` — all of it. `profile-general-data.tsx` and `win-loss-record.tsx` were
  async server components SSR-fetching dead REST; `game-history/index.tsx` was another "not
  implemented" stub; `[username]/page.tsx` was the SSR shell.

Deleted (server route handlers, each used only by the pruned routes):

- `get-character-level-ladder-page.ts`
- `get-user-profile.ts`
- `get-user-ranked-race-game-count.ts`
- `get-user-ranked-race-history.ts`
- `get-user-wins-and-losses.ts`
- `middleware/userIdFromUsernameInPath.ts` (+ now-empty `middleware/` dir)

Edited:

- `create-express-app.ts` — removed the five dead route registrations (`/profiles/:username`,
  `/ladders/level/:page`, `/game-records/count/:username`, `/game-records/:username`,
  `/game-records/win-loss-records/:username`) and their imports. Express server itself stays.
- `lobby/TopBar.tsx` — removed the `/ladder/1` nav link. New nav goes in when the faceted view lands.

### Explicitly KEPT — do not delete these

Checked usage before teardown; these looked dead from the frontend but are live:

- `common/src/servers/services/profiles.ts` (`ProfilesService`, `SanitizedProfile`,
  `ProfileCharacterRanks`) — used across lobby-server, user-session, saved-characters,
  persistence-policy, ironman-run-controller, game-mode-policy-store, lobby-setup-policy.
- `server/src/database/repos/speed-dungeon-profiles.ts` — still used by `entrypoints/bootstrap.ts`.
- `common/src/servers/services/in-memory-profiles-service.ts` — exported from common's index.
- `CharacterLevelLadderService` / `ranked-ladder.ts` — the world XP ladder. Only its REST page
  handler was removed; the service is being extended, not retired.
- `record-types.ts` / `SanitizedRaceGameAggregatedRecord` — still referenced by the game-lifecycle
  controller.

---

## Session log — 2026-07-24

- Moved the whole records model out of `game-modes/` into the new **`common/src/ladder/`** domain:
  `game-modes/ladder-records/` → `ladder/records/` (git mv). It never belonged among the mode
  policies. All importers within common repathed; `index.ts` exports updated; `../index.js`
  (game-modes) imports inside the moved files fixed to `../../game-modes/index.js`. Server/client were
  untouched — they import via the `@speed-dungeon/common` barrel.
- Wrote the read side as `LadderQueries` + `…Query`/`…View` types (types only), split one-per-use-case
  under `ladder/queries/`. Deliberately NOT "gateway" (verified Fowler; collides with our connection
  gateway). Shapes + CQRS-lite rationale under "The actual work".
- **Implemented the persistence read methods** (increment step 3). Added five read methods to
  `LadderRecordsPersistenceStrategy`: `getFloorClearTimes`, `getWinRateLadder`,
  `getPlayerProfileData`, `getCharacterFloorClearSnapshot`, `getExperiencePointsLadderCharacters`.
  They return **id-keyed `…Entry` intermediates** (`FloorClearEntry`, `WinRateEntry`,
  `PlayerProfileData`, `ExperiencePointsLadderCharacterEntry`, `WinLossTally`) — NOT the
  username-carrying `…View`s. Named `…Entry` (matches `UserGameHistoryEntry`), deliberately not
  `…Row` — the DB repos already use `…RecordRow` for literal SQL rows and we didn't want to overload it.
- **First integration test PASSING (2026-07-24).** `integration-tests/src/ladder/read-queries/`
  (`ironman-floor-clear-reads.ts` + `index.test.ts`): plays a real Ironman run, descends two floors,
  then asserts `getFloorClearTimes` + `getPlayerProfileData`, deriving expectations from
  `getGameRecordAggregate` (ground truth) so it's robust to exact tick timing. Green means the whole
  Ironman write→read→projection path is validated against real records: sort/rank, cumulative
  summation across two floors, player attribution, snapshot-id linkage, and profile personal-bests.
  Surfaced the read queries as passthroughs on `LadderGameRecordsService` (the shared handle the
  fixture exposes, and where the eventual LadderQueries impl will call in). Added a 3-floor
  immediate-staircase dungeon fixture (`TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE`) so a run can
  descend twice without exploring/escaping. Confirmed: entering a floor lands the party on its room-0
  staircase, so consecutive immediate descents work.
- **`FloorClearEntry` and `FloorClearView` are one generic**, not two hand-synced interfaces:
  `FloorClear<TPlayer>` (in `queries/floor-clear-times.ts`) with a shared `players: TPlayer[]` and a
  shared `FloorClearCharacter` sub-shape. `FloorClearView = FloorClear<Username>`,
  `FloorClearEntry = FloorClear<IdentityProviderId>`. They differ in nothing but the player-ref type,
  so they can't drift, and Entry→View is just `{ ...entry, players: entry.players.map(resolve) }`.
  (Win-rate + profile pairs differ by more than the player ref — the View adds a derived `winRate` —
  so they stay as separate shapes; the generic is scoped to floor-clears.)
- **The subtle logic lives once**, in a pure module `ladder/records/ladder-read-model-projections.ts`
  (functions named `project…` / `select…` / `assemble…`, deliberately NOT `build…`/`Builder` — those
  are reserved for the fluent-builder classes like `ItemBuilder`). Both strategies are thin adapters
  that load plain record arrays (Maps in-memory, SQL on Postgres) and hand them to the projections,
  so in-memory and Postgres can never diverge on race-winner resolution, win/loss tallying, or
  personal-best grouping. This is a read-side *projection* (mapper), not a factory/builder.
- **Semantics baked in** (confirm if any feel wrong when the UI lands): win/loss is race-only
  (`GameMode.RankedRace`); a **win = your party had the earliest escape timestamp** in the game
  (ties = co-winners), a loss = anything else (wiped, or escaped-but-not-first); a game only counts
  toward `gamesPlayed` once the user's party has a fate (in-progress games are skipped). Floor-clear
  times sort fastest-first and page at `LADDER_PAGE_SIZE` (20). Personal bests = the user's fastest
  clear per `(floor, mode, controlScheme)`, ranked by floor order.
- ~~**Postgres SQL is UNVERIFIED against a live DB**~~ **RESOLVED 2026-07-24** — the Postgres read
  strategy now passes the full read-query suite against a real DB via Testcontainers (see the
  "Postgres-backed read-query test — GREEN" entry up top). Both original worries checked out:
  participant-id typing (numeric PK) and mode/control-scheme filtering both behave correctly.

---

## Session log — 2026-07-24 (race ladder policy)

- **Implemented `RankedRaceModeLadderPolicy`** (`game-modes/race-modes/ranked-race-ladder-policy.ts`),
  previously fully stubbed. Written as a multi-party mirror of `IronmanModeLadderPolicy` — all the
  service plumbing (`recordNewGame`, `updateGameRecordAggregate`, `recordPartyFloorClear`) already
  iterates `game.adventuringParties`, so multi-party fell out for free. Hooks: `onGameStart` →
  `recordNewGame`; `onFloorDescent` → aggregate update + `recordPartyFloorClear`; `onPartyEscape` →
  aggregate update; `onPartyBattleVictory` → aggregate update; `onPartyWipe` → aggregate update +
  targeted `updatePartyFate` (see below). Dropped the Ironman `isContinuedRun` guard on start (race
  games are never continued runs — that's an Ironman `requireIronmanRun` concept).
- **Winner detection needs no special work in the policy.** The controllers set `party.fate =
  { type: Escape, timestamp }` *before* calling `ladder.onPartyEscape` (`dungeon-exploration.ts:163`)
  / `ladder.onPartyWipe` (`party-lifecycle.ts:20`), and `updateGameRecordAggregate` persists each
  live party's `fateOption` (incl. the escape timestamp). So `raceWinnerPartyIds`
  (earliest-escape-in-game) gets its timestamps just by calling the aggregate update.
- **Non-obvious wrinkle — the detached-party wipe on solo leave.** For race (in
  `gameModesWhereLeavingRemovesPlayer`), `handlePlayerRemovalOnGameLeave` calls
  `game.removePlayerFromParty` **before** the wipe; if that player was solo, their party is *deleted
  from `game.adventuringParties`* (`game/index.ts:406-412`), then `handlePartyWipe` sets `party.fate`
  on the now-detached object and calls `onPartyWipe`. `updateGameRecordAggregate` only sweeps *live*
  parties, so it silently skips the detached one — the loss would never be persisted, and
  `computeRankedRaceTally` skips games where the user's party has no `fateOption` (so it wouldn't even
  count as a game played). Fix: `onPartyWipe` also calls `updatePartyFate({ partyRecordId, fate,
  deepestFloorReached })` directly (looks the record up by id, independent of the live map). Escape
  doesn't have this problem — the escaping player stays in the game through the descent, so the party
  is still live when its fate is persisted.
- **`onLiveGameLeave` / `onLastPlayerLeftLiveGame` intentionally NOT overridden** (inherit base
  no-ops). Every fate is persisted at the moment it happens (escape, battle-wipe, and leave-induced
  wipe all route through the escape/wipe hooks), so no final sweep is needed — and Ironman's
  `onLastPlayerLeftLiveGame` couldn't be reused anyway since `getUpdatedUserIdsToUsernamesMap` is
  Ironman-only (`requireIronmanRun`).
- **Test-fixture ceremony DRY'd up while writing the race test.** Extended
  `createTwoClientsInLobbyGame` / `createTwoClientsInGameServerGame` with `{ mode, separateParties }`
  (separateParties → bravo makes their own party instead of joining alpha's; needed for the two-party
  race) and had them return the party/character names. Added `createSingleClientInGameServerGame`
  ({ mode?, characterName?, combatantClass? }) for the single-party single-client flow and refactored
  `ironman-floor-clear-reads.ts` onto it — the same authed-createGame→createCharacter→ready→await-
  GameStarted dance is duplicated in `run-escape.ts` and `save-game-record-on-start.ts`, which could
  adopt it too. Note the helper is only valid for single-party modes (Ironman/Progression); race
  needs explicit party creation.

## Follow-ups / open questions

- `frontend/src/app/lobby/user-menu/index.tsx:170` still does
  `router.push(\`/profile/${username}?page=1\`)`. Will 404 until the new profile view ships at the
  same path. Left intentionally; re-point or restore when profiles are rebuilt.
- Offline <-> online profile reconciliation: when a player plays offline then goes online, do local
  IndexedDB stats merge into their server profile, or stay separate? Not yet decided.
- **Deleted accounts orphan everything except ladder records.** Nothing in this repo handles account
  deletion — it happens entirely at the external auth service and reaches us only as the
  `UsernameDirectory` no longer resolving that id. Ladder records survive that deliberately (that is
  what `lastKnownUsername` is for), but profiles, saved characters, and saved ironman runs are all
  keyed by `IdentityProviderId` and just orphan. Decide whether that needs a cleanup path.
- Whether the XP ladder facet hides or degrades offline (see above).
- Pagination shape for the leaderboard queries — old page used `USER_GAME_HISTORY_PAGE_SIZE`-style
  paging; decide per-facet page sizes and where those constants live (`app-consts.ts`). Currently all
  facets share `LADDER_PAGE_SIZE` (20).
- **Floor timing — RESOLVED 2026-07-24.** Three distinct quantities, only one stored:
  - `timeSpentOnFloor` (per-floor **active** duration) — stays the stored source of truth + headline
    sort metric. It's active-time-only (there's a game-clock / pause-continue mechanism, so it is NOT
    recoverable from wall-clock timestamps — hence store it, don't derive it).
  - `cumulativeTimeToClearFloor` (active time from game start through clearing floor X) — **added**,
    derived in the projection as the running sum of `timeSpentOnFloor` over the party's floors 1..X.
    No schema change. Best-effort: undercounts if an earlier floor's record is missing.
  - `gameStartedAt` (renamed from the misleading `clearedAt`) — the run's date (= game start), for
    date-sorting/display. We deliberately do NOT store or derive an absolute wall-clock per-floor
    clear time; the ladder doesn't need calendar clear-times, and the run date is honest for a "date"
    column. (A run actually has two candidate dates — game start, and party fate/abandon time — that
    distinction matters for the game-history list below, not for floor-clear rows.)
- **Game history in profiles — DEFERRED to a subsequent phase (spec captured).** A per-user list of
  their **Ironman + RankedRace** games (exclude Progression), by date, showing outcome
  (Escaped / Wiped / Abandoned / InProgress). Mostly already built: `getUserGameHistory` on the
  strategy already returns per-game fate + abandoned timestamp; the remaining work is to add `mode`,
  filter out progression, and collapse fate+abandoned into one outcome. Do it as its own **paginated**
  query (`getPlayerGameHistory(username, page)`) — history is long and wants its own paging — not as a
  list stuffed into `PlayerProfileView`.
  - **"One abandoned, another finished" IS representable** — from two ownership-independent records:
    per-player abandonment lives on `LadderGameParticipationRecord.abandonedAtOption` (records exactly
    who left and when), and the run's eventual fate lives on `LadderPartyRecord.fateOption` (the party
    continued under the new owner; its final escape/wipe lands there). So a row can show "you abandoned
    on X; the run went on to <fate> on Y", and since participations enumerate every player's abandon
    flag, the fuller multi-player story is available too, not just the profile owner's.
  - **Derive outcome from participation + party fate, NOT live ownership.** Outcome enum = Abandoned /
    Escaped / Wiped / InProgress. "Did I abandon?" → my participation record (always correct).
    "Run's fate?" → read the game's party fate directly. `getUserGameHistory` today walks *current*
    character ownership to find the querying player's party fate, so for an abandoner (characters
    transferred away) it returns undefined — fix that lookup when building this facet. Single-party
    runs: read the game's party fate directly. Multi-party: tie player→party via participation /
    owner-at-time (same denormalization as the floor-clear attribution above).
- **Abandonment attribution — data EXISTS; proper fix is a write-path denormalization (deferred).**
  A player can abandon a run (esp. Ironman) and their characters transfer to another player. The read
  side currently derives `FloorClear.players` from `LadderCharacterRecord.controllingPlayerId` (the
  *current* owner), so a pre-abandonment clear gets credited to the NEW owner — wrong only in that
  transfer edge; correct for the common no-transfer case, and it's blob-free + keeps the generic clean.
  Correction to an earlier note: the owner-AT-CLEAR-TIME IS stored — each `LadderCharacterFloorClearRecord`
  snapshots the live combatant, whose `controlledBy.controllerPlayerName` was the controller then
  (`createCharacterFloorClearRecords`, `ladder-records-service.ts`). But it's a **name-at-time inside
  the snapshot blob**, and we deliberately don't load blobs for the ladder. So the clean fix is to
  **stamp the clearer onto `LadderCharacterFloorClearRecord` as its own column at write time**
  (migration + write-path edit — NOT this read increment). Open decision: store the **name-at-time**
  (trivial — already on the combatant; historical; but a frozen string, not profile-linkable, and it
  would collapse the `FloorClear<TPlayer>` generic to just usernames) vs the **`IdentityProviderId`**
  (stable across renames, resolvable to current username, correct after transfer, preserves the
  generic; needs a name→id resolution at write time — the service has the game's player mapping).
  Current lean: id. Win-rate's `playerPartyInGame` has the same current-owner assumption, but the
  transfer scenario is Ironman-centric (race characters don't transfer), so it's lower-risk there.

### Scaling of the read queries — a tiered plan, profiler-gated

The projections pull full record arrays into process memory. That's free for the in-memory strategy
(all RAM anyway) but on Postgres it means work that wants to be a SQL aggregate. NOTE: the durable
offline store is **IndexedDB** (step 4), NOT the in-memory strategy — in-memory is ephemeral and
loses every record on refresh/close. The IndexedDB strategy will be another thin adapter over the
same storage-agnostic projections; only the row-loading changes. Deliberately staged; we have **zero production data**, so anything past tier 1 would be
optimizing against imagined load with made-up constants. Sequence:

- **Tier 1 — don't load what we never use. DONE for profiles (2026-07-24).** `getPlayerProfileData`
  now selects the user's personal-best clears *first*, then loads characters + heavy snapshot blobs
  only for that handful — never for rival parties or non-best clears. The tally half loads only tiny
  party-fate rows. This isn't speculative; it's just not fetching unused data.
- **Tier 2 — push the reduction into SQL. Not built; do before this sees real traffic.** The biggest
  offender is `getWinRateLadder`: it currently loads *every ranked-race game + all their parties +
  all their characters* into Node on every ladder page view (whole-table scan into memory). It should
  become a `GROUP BY` per participant with paging in SQL. Profile's personal-bests + tally similarly
  become `MIN()`/`COUNT()` aggregates. The one awkward bit in SQL is "winner = earliest escape in the
  game" (a per-game window / lateral). The in-memory path is unaffected by all this.
- **Tier 3 — precompute + cache, update on write. Escape hatch only, almost certainly premature.**
  If even the tier-2 aggregate is too slow at "a bajillion" records, maintain per-user win/loss
  counters + a personal-best table, bumped in the write path; reads become a single-row lookup. The
  permanent cost is a denormalized copy that can drift (needs backfill/repair) and a consistency
  burden on every write. **Do NOT build this until a profiler on real traffic proves the tier-2 query
  is the actual bottleneck** — skipping here means maintaining cache invalidation for a 400-row table.

    ## For the read layer over the DB

    In the end we want a ladder viewer with several categories. We will need reads for:
    - Highest experience points progression characters by control scheme
    - Fastest clear times by floor, including party name, date, players, and character names with links
      to view the snapshots of those characters. These will be for race and ironman modes, but not progression.
    - Players with highest win rate in ranked race, with their win/loss records
