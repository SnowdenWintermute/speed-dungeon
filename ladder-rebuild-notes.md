# Ladder / Profiles Rebuild — Running Notes

Working doc for the multi-session ladder + profiles rebuild. Maintained by Claude across sessions;
throw it out when the work lands. Purpose is cross-session context, not permanent documentation.

Started 2026-07-23.

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
3. Implement the queries — in-memory first (cheapest to test), then Postgres.
4. IndexedDB strategy for offline.
5. Wire the online gateway impl over socket request/reply.
6. Build the faceted view UI, reusing the old Tailwind table styling.
7. Rebuild profiles at `/profile/:username` (client-rendered).
8. XP ladder re-keying for control scheme + total view.
9. _Optional phase 2:_ live-updating ladder via server push. Needs subscription bookkeeping (who is
   watching which facet) and throttling — do not push on every XP tick. Explicitly NOT baseline.

---

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

---

## Follow-ups / open questions

- `frontend/src/app/lobby/user-menu/index.tsx:170` still does
  `router.push(\`/profile/${username}?page=1\`)`. Will 404 until the new profile view ships at the
  same path. Left intentionally; re-point or restore when profiles are rebuilt.
- Offline <-> online profile reconciliation: when a player plays offline then goes online, do local
  IndexedDB stats merge into their server profile, or stay separate? Not yet decided.
- Whether the XP ladder facet hides or degrades offline (see above).
- Pagination shape for the leaderboard queries — old page used `USER_GAME_HISTORY_PAGE_SIZE`-style
  paging; decide per-facet page sizes and where those constants live (`app-consts.ts`).

    ## For the read layer over the DB

    In the end we want a ladder viewer with several categories. We will need reads for:
    - Highest experience points progression characters by control scheme
    - Fastest clear times by floor, including party name, date, players, and character names with links
      to view the snapshots of those characters. These will be for race and ironman modes, but not progression.
    - Players with highest win rate in ranked race, with their win/loss records
