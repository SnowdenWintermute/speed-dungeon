# Ladder / Profiles Rebuild — Running Notes

Working doc for the multi-session ladder + profiles rebuild. Maintained by Claude across sessions;
throw it out when the work lands. Purpose is cross-session context, not permanent documentation.

Started 2026-07-23.

---

## Where we are / resume here (2026-07-24)

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
`getExperiencePointsLadderCharacters` stays out of scope: it's the Progression-only XP facet, and
**progression characters hydrate from their actual persisted character entity, not a
`LadderCharacterRecord`** (don't mirror a live entity into a denormalized record) — its hydration path
is part of the XP re-keying work (step 8).

> ⚠️ **These read-query tests are a STOPGAP — they don't yet test what we ultimately care about.** They
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
- Minor cleanup still open: `node-pg-migrate` works from integration-tests via yarn hoist but isn't
  declared there — add it as a devDep for correctness.

**Next (moving off the read increment — the whole read side is now validated on both stores):**
steps 4-8 (IndexedDB offline, socket wiring for the LadderQueries impl, faceted UI, profiles, XP
re-keying); and the deferred write-path items (owner-at-clear-time `IdentityProviderId` denormalization;
game-history facet).
- Later, unchanged: Postgres SQL still needs a DB-backed test; then steps 4-8 (IndexedDB offline,
  socket wiring for the LadderQueries impl, faceted UI, profiles, XP re-keying); and the deferred
  write-path items (owner-at-clear-time `IdentityProviderId` denormalization; game-history facet).

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

### XP ladder — needs new keying work

Today `CharacterLevelLadderService` uses a single sorted set (one key, `CHARACTER_LEVEL_LADDER`),
with no control-scheme dimension. Required:

- Per-control-scheme ladders (best Freelancer, best Captain) viewable separately.
- An all-up "total" ladder across all players regardless of mode.
- Every row carries **mode and control scheme as context columns**, so a viewer always knows what
  they're looking at — especially in the combined view.

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
5. Wire the online gateway impl over socket request/reply.
6. Build the faceted view UI, reusing the old Tailwind table styling.
7. Rebuild profiles at `/profile/:username` (client-rendered).
8. XP ladder re-keying for control scheme + total view.
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
