# VPS Deployment Plan

Working notes for moving speed-dungeon from local dev to a Docker Compose deploy on a VPS,
including running more than one game server.

Update the status markers and the log at the bottom as steps land.

---

## Where we are now

**Phases 1–3.1 are done.** `packages/server/src/entrypoints/` holds three role entrypoints —
lobby (8080), game server (8090), asset server (8100) — each its own process with its own env
schema. The lobby selects a live game server from the Valkey-backed registry, game servers
heartbeat into it and fetch gameplay asset facts over HTTP from the asset server, and
reconnection resolves urls from the registry.

Remaining: verify multi-process locally (3.2), then Docker (Phase 4).

The original single-process state, for reference: `main.ts` ran both server nodes together,
lobby on 8080 and game server on 8090 sharing the lobby's Express app, with one PG pool, one
Valkey connection and one in-memory token secret. Everything in this plan exists because that
process had to become separate roles before a second game server was possible.

Handoff already works correctly in the abstract: `GameHandoffManager.initiateGameHandoff`
asks `getLeastBusyGameServer()` for a `{ name, url }`, writes a `PendingGameSetup` to the
shared store, and sends each client a `GameServerConnectionInstructions` update carrying
that url plus an encrypted claim token. The client honors whatever url it is given. So the
protocol does not need to change — only the things that are currently hardcoded or
process-local.

---

## Design decisions

**Static pool of game servers first, dynamic Docker provisioning later.**
Spawning containers from the lobby needs `/var/run/docker.sock` mounted (root-equivalent on
the host), and scaled replicas have no stable published port or public hostname, so a reverse
proxy with dynamic routing is required either way. A fixed pool of already-running idle game
servers avoids both. Provisioning goes behind an interface so the Docker version can drop in
later without touching the lobby.

(A third argument — that cold spawn makes a waiting party sit through boot-time gltf
analysis — is removed by the asset facts document in 1.4. Worth revisiting the deferred
decision once that lands.)

**Least-busy lookup is backed by Valkey, not a static record.**
The same registry replaces `gameServerUrlRegistry`, which is currently a literal passed at
`lobby-node/index.ts:85` and is used by the reconnection path
(`lobby-server/reconnection/index.ts:136`) to resolve a server name to a url. If that stays
static, reconnecting to any server not in the literal fails.

**Game servers report their own game count in a heartbeat.**
`ActiveGameStatus` does not record which server hosts a game, so counts cannot be derived
from `getActiveGames()` today. Rather than add a host field and scan every game on each
handoff, each game server heartbeats `{ name, url, activeGameCount }` into the registry.
`GameServer` already owns a `HeartbeatScheduler` (`game-server/index.ts:85`) running at
`GAME_RECORD_HEARTBEAT_MS`, so this is one more `HeartbeatTask` on an existing loop.

---

## Offline mode — standing constraint

`client-application/src/connection-topology/create-offline-servers.ts` builds a real
`LobbyServer` and `GameServer` **in the browser**, wired to all-in-memory services and the
`InMemoryConnectionEndpointServer` transport. Nothing about it touches `packages/server`, so
the entrypoint split (Phase 3), Docker (Phase 4), migrations, and nginx are all irrelevant to
it. Three things do touch it:

- **Token secret (1.1).** Offline generates its own via `SodiumHelpers.createSecret()`
  (`create-offline-servers.ts:88`) and both codecs share it in-process, so it keeps working.
  Just do not delete the generate path when `main.ts` switches to reading env — offline and
  tests still need it.
- **Server registry (2.1/2.4).** Offline currently passes a static
  `{ [LOCAL_OFFLINE_GAME_SERVER_NAME]: LOCAL_OFFLINE_GAME_SERVER_URL }` record plus a
  hardcoded least-busy getter. When `gameServerUrlRegistry` is replaced, offline needs the
  in-memory registry impl pre-populated with its one local server — mirroring how it already
  uses `InMemoryGameSessionStoreService`. This is why 2.1 specifies an in-memory impl.
- **Asset facts (1.4).** This is the one that would have broken it. Offline has no network by
  definition, and calls `analyzeAssetsForGameplayRelevantData()` at
  `create-offline-servers.ts:156`. If that became "fetch from the asset server," offline dies.
  The `AssetServer`-class design fixes this: offline instantiates `AssetServer` over its
  IndexedDB store and the game server reads facts from it directly, in-process.

The compute path therefore never becomes dead fallback code — it is what the deployed asset
server runs *and* what offline runs. Exercised on both ends.

**Check offline mode still starts after each of 1.1, 1.4, and 2.4.** It is the easiest thing
in this plan to break without noticing, because nothing about the VPS deploy exercises it.

---

## Phase 1 — make the split possible

These are correctness prerequisites. Nothing here changes behavior in the single-process
setup, which means each one can land and be verified independently before any container work.

### 1.1 Shared token secret — status: DONE (2026-07-20)

`main.ts:52` does `SodiumHelpers.createSecret()` per process, and both codecs derive from it.
It only works today because lobby and game server are the same process. Once they are
separate containers the game server cannot decrypt the lobby's `GameServerSessionClaimToken`.

What was done:

- `TOKENS_SECRET` added to `validate-env.ts` and `packages/server/.env` (gitignored).
- `main.ts:51` reads `env.TOKENS_SECRET` instead of calling `createSecret()`.
- `SodiumHelpers.assertUsableSecret()` added and called at boot, so a bad secret fails
  immediately with a clear message instead of at handoff time. A secret is a base64
  `crypto_secretbox_KEYBYTES` (32-byte) key; malformed base64 throws at decode, wrong length
  is caught by an explicit length check. Both paths verified against libsodium.
- `ERROR_MESSAGES.SERVERS.MALFORMED_SECRET` includes the generate command.
- `createSecret()` deliberately left in place — still used by offline mode
  (`create-offline-servers.ts:90`) and the integration fixtures
  (`create-test-servers.ts:96`), which are same-process and need no shared secret.

**Still to do when deploying:** generate a *different* `TOKENS_SECRET` for production and put
it in the deploy env file. Every lobby and game server container must share it. Rotating it
invalidates in-flight claim tokens, so rotate at low traffic.

Verify: start normally, create a game, confirm handoff still succeeds.

### 1.2 Env-driven `MANUAL_TEST_MODE` — status: DONE (2026-07-20)

`manual-test-mode-config.ts:29` was a source-level `const` shipping in the production image,
so a stray commit could deploy fixture characters and scripted dungeons to prod.

What was done:

- `MANUAL_TEST_MODE: bool({ default: false })` in `validate-env.ts`; the const now reads it.
  Default-off means the deploy env file does not have to mention it.
- Added a **hard refusal**: `validate-env.ts` throws at module load if `MANUAL_TEST_MODE` is
  on while `NODE_ENV=production`. Env-driven alone stops a stray *commit*; this also stops a
  stray *env file*, which is the likelier mistake now. Remove it if it ever gets in the way of
  debugging against a production-like config.
- Documented in `.env` with the explicit `MANUAL_TEST_MODE=false`.

Note the type of the exported const widened from literal `false` to `boolean`. Both call
sites (`lobby-node/index.ts:71`, `game-node/index.ts:78`) are if/else assigning the same
field, so nothing downstream cares.

### 1.3 Migrations out of the game server boot path — status: DONE (2026-07-20)

**Correction to the original audit:** this was written up as a "migration race", which was
wrong. node-pg-migrate 7.7.1 takes a Postgres advisory lock by default (`runner.js:212`,
`runMigrations` does not pass `noLock`), so concurrent runs cannot corrupt the schema. But it
uses `pg_try_advisory_lock` — non-blocking — so a loser throws
`"Another migration is already running"`, which `runMigrations()` catches and turns into
`process.exit(1)`. The real failure mode on parallel boot is **crash-looping containers**.

**Decided: keep migrating on lobby boot; game servers skip it.** No init container. With one
lobby there is no contention, and an init container is machinery this project does not need
yet.

- `RUN_MIGRATIONS_ON_BOOT: bool({ default: true })` in `validate-env.ts`; `main.ts` gates the
  call on it. Game server containers set it false.

Reasons to revisit later, none urgent at this scale:

- a bad migration `process.exit(1)`s the lobby into a restart loop with the game down, rather
  than failing a deploy step and leaving the old version up
- the runtime DB user needs DDL rights permanently
- it stays safe only while there is exactly **one** lobby — two replicas or an overlapping
  rolling deploy and the loser exits 1

Unrelated smell noticed while reading: `runMigrations` swallows Postgres error `42P07`
("table already exists") and reports success. That suggests a migration somewhere is not
idempotent. Worth a look sometime, not part of this work.

### 1.4 Asset serving moves to its own role — status: CODE DONE (2026-07-20), container split pending 3.1

The restructure below is done. The `AssetServer` still runs inside the combined process and
attaches to the lobby's Express app; moving it to its own container happens with the
entrypoint split (3.1) and compose (4.3).

What landed:

- `common/src/servers/asset-server/index.ts` — `AssetServer`, peer of `LobbyServer`/
  `GameServer`, implements `GameplayAssetFactsSource`. Owns the analyzer, `initialize()`
  computes once, `getAssetManifest()` moved here from `packages/server`.
- `common/src/servers/services/assets/gameplay-asset-facts.ts` — `GameplayAssetFacts`,
  `VersionedGameplayAssetFacts`, `GameplayAssetFactsSource`.
- `common/src/servers/services/assets/http-gameplay-asset-facts-source.ts` — the deployed
  game server's implementation.
- `AssetAnalyzer` **moved** from `servers/game-server/asset-analyzer/` to
  `servers/asset-server/asset-analyzer/` — it is not a game server concern anymore.
- `GameServerNodeAssetService` **renamed** to `LocalStoreAssetService`. Both halves of the old
  name were wrong: it is not game-server-specific, and offline uses it in the browser over
  IndexedDB, so it is not "node" either.
- `packages/server/src/asset-server/index.ts` is now `AssetServerRouter`, a thin Express
  adapter serving `/asset-manifest`, `/gameplay-asset-facts`, `/assets/*`.

**Design change during implementation** (Mike caught it): the sketch had `AssetAnalyzer` gain
a `load()` so a game server could stuff in facts it did not compute — muddling a class whose
whole job is computing them. Instead `GameplayAssetFacts` is a plain immutable object passed
to the `GameServer` constructor and down to the three controllers that need it
(`BattleProcessor`, `CombatActionController`, `DungeonExplorationController`), which only ever
read `.animationLengths` / `.boundingBoxes`. The analyzer keeps a `getFacts()` producer method
and nothing else changed about it.

Consequences of that change, all good:

- facts must exist *before* `new GameServer(...)`, so the post-construction mutation pattern
  (`analyzeAssetsForGameplayRelevantData()`) is gone entirely
- `assetService` was removed from `GameServerExternalServices` — game servers now have **no
  asset access of any kind**, which is what makes "no asset binaries in the game server image"
  structural rather than a convention
- the integration fixture's `previouslyCalculatedAnimationLengths` caching machinery was
  deleted; `create-test-servers.ts` memoizes one `AssetServer` at module scope instead

Also revised from the sketch: `getGameplayAssetFacts()` is **not** an abstract method on
`RemoteAssetStore`. `processCombatAction` is called only from game-server controllers, so the
client never needs facts, and putting it there would force the two client-side stores to
implement a method only servers call.

**Decided: a dedicated asset container.** Assets will grow a lot (sounds, textures), so they
should not ride along with the lobby or be duplicated per game server.

Today `GameServerNode.createServer` attaches the asset router to the **lobby's** Express app
(`game-node/index.ts:63`), so assets are served on 8080 while the game WS is on 8090.

The split is easy on the serving side: `AssetServer` only needs a `NodeFileSystemAssetStore`
and an Express app — no database, no valkey, no auth. It becomes a third, very light
entrypoint. Drop the `expressApp` parameter from `GameServerNode.createServer`.

**The nuance:** naively, a dedicated asset container does *not* get asset files out of the
game server. `GameServerNode` builds a `GameServerNodeAssetService` over the local
`NodeFileSystemAssetStore`, and `analyzeAssetsForGameplayRelevantData()`
(`game-server/index.ts:244`) reads gltf binaries at boot to derive animation lengths and
bounding boxes. That would keep the whole gltf set in every game server image.

### The fix: analyze once on the asset server, serve the facts

**Run the analysis on the asset server** and publish the result as a small JSON document.
Game servers fetch it at boot and cache it, re-fetching only when its hash changes. Game
server images then need *no* asset binaries at all.

This fits the existing code almost exactly:

- `AssetAnalyzer` output is already plain serializable data — `SpeciesAnimationLengths`
  (`Record<CombatantSpecies, Record<string, Milliseconds>>`) and `BoundingBoxSizesBySpecies`.
  No classes, no cycles.
- `AssetAnalyzer.animationLengths` already has a public setter, so injecting fetched values
  instead of computing them needs no restructuring.
- The hash mechanism exists. `AssetVersionData` is `{ sizeBytes, hash }` and
  `AssetServer.createManifest()` already builds an `AssetManifest` of them, which the client
  already uses to decide what to refetch. Derive the facts-document version from the hashes
  of the assets it was computed from, and game servers get the same
  fetch-only-if-changed behavior the client has.

**Decided: startup-only recompute.** Changing an asset means restarting everything. Live asset
updating is a later idea — on asset change, either message the game servers or write a key to
Valkey that they check on their existing heartbeat. Not now.

### Shape: a real `AssetServer` class

Make `AssetServer` a peer of `LobbyServer` and `GameServer` in `common`, rather than
parameterizing `AssetAnalyzer` with compute/fetch strategies. Both routes end up with the game
server depending on an interface with two implementations, but this one reuses a seam that
already exists instead of adding a second parameterization concept next to the store
abstraction that already does this job.

Why the seam already exists: `RemoteAssetStore` (`stores/index.ts`) is an **abstract class**,
not an HTTP client, and integration tests already ship a non-HTTP implementation —
`InMemoryRemoteAssetStore` (`integration-tests/src/fixtures/in-memory-remote-asset-store.ts`),
used by `client-test-fixture.ts` to serve assets with no network. "Something that isn't a real
HTTP server answers asset requests" is an established pattern here.

- **`AssetServer` in common** owns the `AssetAnalyzer` and a store; exposes
  `getAssetManifest()` and `getGameplayAssetFacts()`. Computes on startup.
  `packages/server/src/asset-server/index.ts` is already most of this — the domain half just
  needs lifting out of the Express coupling, leaving a thin node wrapper. Same
  common-class/node-wrapper split the other two servers already use.
- **One new abstract method on `RemoteAssetStore`**: `getGameplayAssetFacts()`.
  `RemoteServerAssetStore` implements it over HTTP with the hash check; in-memory impls answer
  directly.
- **Game server** on boot gets the facts from that source instead of calling
  `analyzeAssetsForGameplayRelevantData()`. Deployed, it is an HTTP fetch against a hash;
  offline, it is a direct call.

**Trap to avoid:** do not make offline "fetch" by routing through
`InMemoryConnectionEndpointServerRegistry`. That registry is for the websocket intent
protocol; assets travel over plain `fetch` through an entirely separate seam. Simulating HTTP
over the ws mechanism is the genuinely complicated version of this. Offline holds an
`AssetServer` reference and calls it directly.

**Knock-on benefit:** this removes gltf parsing from game server boot entirely, which was one
of the three arguments against dynamic provisioning (see Deferred). A game server that fetches
a small JSON document instead of parsing every skeleton starts fast enough that on-demand
spawning becomes much more reasonable later.

Client-only assets (textures, sounds) then never touch a game server, and the asset container
should use a volume or bind mount rather than baking a growing asset set into its image.

### 1.5 Fix client-side hardcoded urls — status: DONE (2026-07-21)

- `create-client-application.ts` now reads `NEXT_PUBLIC_ASSET_SERVER_URL` with an `invariant`,
  matching how the lobby url is handled, instead of hardcoding `http://localhost:8080`.
- `.env.production` gained `NEXT_PUBLIC_ASSET_SERVER_URL="https://roguelikeracing.com/api"`.
  `/api` because `appRoute()` prefixes routes with it when `isProduction`, so the manifest and
  asset routes live at `/api/asset-manifest` and `/api/assets/*`. **Repoint this at the
  dedicated asset container's route in 4.4** — today it still resolves to the combined
  process. `.env.development` already had the variable and needed no change.

Unrelated dead config found here: `NEXT_PUBLIC_ASSET_BASE_PATH_3D` feeds `BASE_FILE_PATH` in
`frontend/src/client-consts.ts:3`, which has **zero consumers**. Both the constant and the two
env entries can go. Left alone for now to keep this step narrow.

---

## Phase 2 — the server registry

Design agreed 2026-07-21. Phase 1 is complete; this is where multi-server behavior starts
actually existing.

### 2.1 `GameServerStatus` + `GameServerRegistry` — status: DONE (2026-07-21)

Landed as designed below, with two adjustments:

- the method is **`unregister`**, not `deregister` — matches the verb the codebase already
  uses (`GameRegistry.unregisterGame`, `HeartbeatScheduler.unregister`)
- added **`getAllServers()`** to the interface. `getLiveServers()` filters stale statuses out,
  which means the dangling-resources cleanup could not see the very things it needs to prune.
  Live-filtering and prune-scanning are genuinely different queries.

Files: `common/src/servers/services/game-server-registry/{index,game-server-status,
in-memory-game-server-registry}.ts`, `server/src/services/valkey-game-server-registry.ts`,
`GAME_SERVER_HEARTBEAT_MS` in `app-consts.ts`, three barrel exports.

**Open question for 2.4:** `getServerByName` currently returns a status regardless of
staleness. For reconnection that means we could hand a client the url of a dead game server.
Filtering there instead risks failing a reconnect during a brief heartbeat blip. Decide when
wiring reconnection — the game-existence check may already cover it.


The record is **`GameServerStatus`**, deliberately parallel to `ActiveGameStatus` — they are
the same kind of thing (a heartbeat-refreshed liveness record with `isStale()`), so they
should read the same. The holder is the `GameServerRegistry`.

`common/src/servers/services/game-server-registry/game-server-status.ts`:

```ts
export class GameServerStatus implements Serializable {
  private lastSeenAt: number = Date.now();
  constructor(
    readonly name: GameServerName,
    readonly url: string,
    public activeGameCount: number
  ) {}
  toSerialized() / static fromSerialized()
  isStale()   // lastSeenAt older than GAME_SERVER_HEARTBEAT_MS * 2
  refresh(activeGameCount: number)
}
```

`.../game-server-registry/index.ts`:

```ts
export interface GameServerRegistry {
  register(status: GameServerStatus): Promise<void>;
  heartbeat(name: GameServerName, activeGameCount: number): Promise<void>;
  getLiveServers(): Promise<GameServerStatus[]>;   // stale filtered out
  getServerByName(name: GameServerName): Promise<GameServerStatus | null>;
  deregister(name: GameServerName): Promise<void>;
}
```

Two impls mirroring `GameSessionStoreService`: `InMemoryGameServerRegistry` in `common`,
`ValkeyGameServerRegistry` in `packages/server` over a single hash
(`game-server-registry:servers`), following `ValkeyGameSessionStoreService`'s style.

`GAME_SERVER_HEARTBEAT_MS` goes in `app-consts.ts`.

Note from prior work: the Valkey impls cannot be integration-tested under fake timers
(node-redis hangs). Test against the in-memory impl.

**Pruning landed 2026-07-21**, late — 2.1 specified it and `getAllServers()` was added for it,
but the third block was never written, so a killed game server sat in Valkey forever. Found
while prepping 3.2. Covered by `integration-tests/src/server-crashes/`: stop one server's heartbeat, advance past
the stale threshold, assert it is pruned and the still-heartbeating one is not. Verified by
mutation — deleting the pruning block fails the test.

That test needed a fixture change. Servers register their heartbeat intervals *as they are
constructed*, so a `timeMachine.start()` after `resetWithOptions` leaves them as real timers
that advancing time cannot drive. `resetWithOptions` now takes
`{ useFakeTimersFromBoot: true }`, which installs fake timers before the servers exist, so the
real heartbeats and the real cleanup interval both run under the time machine.

`GameServer.stopHeartbeats()` came out of the same work. It is not a test hook:
`ValkeyGameServerRegistry.heartbeat` is a read-modify-write, so a tick interleaving with
`unregister` can re-create the entry it just deleted. `GameServerNode.shutDown()` now stops the
scheduler before unregistering.

**Stale pruning belongs in the lobby's `startDanglingResourcesCleanupHeartbeat`**
(`lobby-server/index.ts:360-380`), which already walks pending setups and active games doing
exactly this — a third block is the same shape in the same place. Explicitly *not* pruning
inside `getLeastBusyGameServer`: a selection method that silently mutates the store does
something its name does not advertise.

### 2.2 Game servers report into the registry — status: DONE (2026-07-21)

Landed as designed. Notes on how it went together:

- `GameServer` gained a `url` constructor param right after `name` — the public url, fed from
  the new `GAME_SERVER_PUBLIC_URL` env var. Each game server container gets its own value.
- `registerWithGameServerRegistry()` is awaited by `GameServerNode.createServer` after
  construction, so a registration failure rejects and takes the process down — the loud
  failure we wanted. `unregisterFromGameServerRegistry()` exists for graceful shutdown.
- the heartbeat task just calls `gameServerRegistry.heartbeat(this.name)` to refresh liveness.
  The count-publishing machinery this step originally carried was removed the same day — see
  the derived-count decision above.
- `GameServerGameLifecycleController` takes the game server's `name`, which it stamps onto
  each `ActiveGameStatus` it writes.

Offline and the integration fixtures **seed** the registry with a pre-registered
`GameServerStatus` rather than calling `registerWithGameServerRegistry()`. Equivalent outcome,
and their heartbeats then find the existing entry and refresh it normally.

`GameServerRegistry` joins `GameServerExternalServices`. Each game server needs its own
**public** url — what clients get told to connect to, not its container address — so that is
an env var; only the deploy knows it.

Register once listening. Facts are constructor-injected now (1.4), so there is no
"analyzed but not ready" window to wait out. **Fail loudly if registration fails** — a game
server nobody can be handed off to should not sit there looking healthy. Revisit once there is
a real deploy to observe. Deregister on graceful shutdown.

**Busy-ness is derived, not reported.** `GameServerStatus` carries no count at all — it is
identity and liveness only (`name`, `url`, `lastSeenAt`), and `heartbeat(name)` just refreshes.

**This reversed the original design**, which had game servers self-report `activeGameCount` on
open/close events. Mike questioned it and was right. The reasoning:

- A self-reported count is a **denormalization** — a second copy of a fact the game records
  already establish. Denormalized counters drift; any path that removes a game outside
  `cleanUpGame`, or a failure between unregistering and publishing, silently desyncs it. A
  derived count cannot be wrong.
- The performance objection did not survive contact: `getActiveGames()` is **already** a full
  scan run every 10 seconds by the lobby's dangling-resources cleanup
  (`lobby-server/index.ts:374`). Doing the same scan once per handoff is strictly less work
  than what the codebase already does on a loop.

Instead, both game records carry their host:

- `ActiveGameStatus` gained `hostingServerName`, set at its one construction site
  (`game-lifecycle/index.ts:81`). The lifecycle controller takes the server name as a plain
  value rather than a wired-up publish callback.
- `PendingGameSetup` gained `hostingServerName` too, set by `GameHandoffManager` from the
  server it just selected.

Including `PendingGameSetup` closes a real gap: a handed-off game is not registered on the
game server until the first player connects, so counting only active games would miss games
in flight, and two games created in quick succession could both be sent to the same server.

Later load signals (CPU etc.) could still live on `GameServerStatus`, though resource metrics
are usually better read from the orchestrator than self-reported.

### 2.3 `getLeastBusyGameServer` reads the registry — status: DONE (2026-07-21)

`LeastBusyGameServerSelector` lives at
`common/src/servers/lobby-server/game-handoff/least-busy-game-server-selector.ts`, next to the
`GameHandoffManager` that consumes its result. It takes the registry and the game session
store, uses `getLiveServers()` for candidates, counts active games **and** pending setups by
`hostingServerName`, and returns the minimum. Throws
`ERROR_MESSAGES.SERVERS.NO_LIVE_GAME_SERVERS` when nothing is live.

`lobby-node` constructs it and passes `() => selector.select()` where the hardcoded
`http://localhost:8090` stub used to be. `main.ts` threads the registry through.

**This is the first behavior change of the phase** — everything before it was additive.

Offline and the integration fixtures still use their own hardcoded getters rather than the
selector. Left alone deliberately: they have one and two servers respectively, and the fixture
override is the seam the ladder tests steer with. Worth revisiting if offline ever needs to
exercise the real selection path.

**Integration test for least-busy selection — DONE (2026-07-21).**
`integration-tests/src/game-server-selection/` covers all four gaps listed below. Tests opt back
into the real path with `IntegrationTestFixture.useRealLeastBusyGameServerSelector()`, which
builds a `LeastBusyGameServerSelector` over the fixture's registry and session store; the
override seam stays for the ladder tests that steer placement deliberately.

Assertions read `clientApplication.topologyManager.gameServerUrlOption` — a new field on
`ConnectionTopology` recording the url `createGameClient` was handed, cleared by
`clearGameClient`. The client did not previously retain that url anywhere, and asserting on the
selector's return value directly was explicitly not what this test is for.

Arranging the pending-setup case took some care: a `PendingGameSetup` exists only between
`initiateGameHandoff` writing it and the game server deleting it on first connect
(`game-lifecycle/index.ts:78`). Skipping `proceedToGameServer` leaves no setup at all, and
toggling ready without awaiting the transition only gives a race window, since the instructions
arrive in the same reply stream `settleIntentResult` awaits and `createGameClient` fires
synchronously in that handler. Mike's call was to pause alpha's lobby transport so the
instructions are buffered and alpha never connects — the real handoff path, with the setup held
still. That needs `ClientTestHarness.dispatchWithoutAwaitingReply`, because a paused client
cannot await its own reply.

Original TODO, kept for the reasoning:

**TODO — integration test for least-busy selection.** Because the fixtures override the getter,
**nothing automated covers `LeastBusyGameServerSelector` at all**: not that a new game goes to
the server with fewer games, not that active games and pending setups are both counted, not that
a dead server is skipped, not that it throws `NO_LIVE_GAME_SERVERS` when none are live. 3.2
checks this by hand once; after that it is unguarded, and it is exactly the logic that decides
where players land. The fixture already boots two servers (Lindblum and Alexandria) and seeds
both into the registry, so the setup exists — the test needs
`setLeastBusyGameServerGetter(() => selector.select())` to opt back into the real path, then
create games and assert which server each client is handed. Keep the override seam for the
ladder tests that steer placement deliberately. Assert on client output (which url the client
was told to connect to), not on the selector's return value directly.

Known wrinkle: a pending setup for a game nobody joins counts against its server until it goes
stale (5 minute TTL) and the cleanup loop reaps it. Normal flow deletes it the moment the
first player connects, so this only affects abandoned handoffs.

Replaces the stub at `lobby-node/index.ts:65`. Add `LeastBusyGameServerSelector` in `common`:
reads the registry, picks the lowest `activeGameCount`, throws clearly when none are live.

**Keep the injectable getter on `LobbyServer`.** `IntegrationTestFixture.setLeastBusyGameServerGetter`
steers which server a game lands on and the ladder tests depend on it — that seam is worth
preserving. `lobby-node` just passes `() => selector.select()` instead of today's hardcoded
stub.

The "spawn a new game server past N games" threshold slots in here later as a
`GameServerFleetManager` the selector consults. Not part of this phase.

### 2.4 Reconnection resolves urls from the registry — status: DONE (2026-07-21)

The static `Record<GameServerName, string>` is gone from `LobbyServer`'s constructor and
`LobbyReconnectionProtocol`; both now take the `GameServerRegistry`.
`getGameServerUrlFromName` is deleted.

As designed, the url is resolved at the already-async site in `evaluateConnectionContext` and
passed down, so `createClaimToken(gameServerUrl)` and `toGameServerSessionClaimToken(gameServerUrl)`
stay synchronous. `GlobalGameSession` gained a `gameServerName` getter and **no longer imports
`LobbyReconnectionProtocol` at all** — a session object no longer depends on the protocol that
reads it.

**Resolved the 2.1 open question:** the registry returns statuses regardless of staleness, and
this caller decides that stale means unavailable. If the server is missing *or* stale,
reconnection returns `InitialConnection` and the player goes back through the lobby rather than
being handed a dead url. That matches how the surrounding code already treats a missing game.

Bonus cleanup: with the static record gone, `GAME_SERVER_NAME` was no longer used in
`lobby-node` or `manual-test-mode-config`, so those `import ... from "./main.js"` lines are
deleted. That was the awkward reach-into-main coupling flagged in the original audit; only
`main.ts` uses the constant now.

Delete `gameServerUrlRegistry` from the `LobbyServer` constructor, and
`getGameServerUrlFromName` from `reconnection/index.ts:135`.

**Do not make `getGameServerUrlFromName` async.** `async` is contagious upward — every caller
that needs the value has to await it and becomes async in turn. The chain here is:

```
getGameServerUrlFromName         reconnection/index.ts:135        (sync)
  ← toGameServerSessionClaimToken  global-auth-game-session.ts:129 (sync)
    ← createClaimToken             global-auth-game-session.ts:56  (sync)
      ← reconnection/index.ts:62                                   (already async)
```

Only three levels deep and the top is already async, so the contagion would stop quickly. But
better: resolve the url at line 62 and pass the string down, so both inner methods stay
synchronous. Side benefit — the session object stops depending on `LobbyReconnectionProtocol`
entirely, a coupling that should not have been there.

### 2.5 Update the construction sites — status: DONE (2026-07-21)

Absorbed entirely into 2.3/2.4 as those steps touched the construction sites. Verified rather
than written: `create-offline-servers.ts:73` seeds an `InMemoryGameServerRegistry` with its one
local server, and `create-test-servers.ts:111` seeds one per entry in
`gameServerGatewaysAndPorts`. `lobby-node`, `game-node` and `manual-test-mode-config` all take
the registry. Nothing left to do.

**Phase 2 complete.**

---

## Phase 3 — split the process

### 3.1 Three entrypoints — status: DONE (2026-07-21)

`main.ts` is **deleted**. `src/entrypoints/` holds `lobby.ts`, `game-server.ts`,
`asset-server.ts` and `bootstrap.ts`. Each entrypoint is a top-level-await module that runs on
import, so its container command is `node dist/entrypoints/<role>.js` with no role flag.

`bootstrapSharedServices()` (lobby + game only) connects the pg pool and valkey, asserts the
token secret, and returns the two token codecs, the game session store, the global session
store, the game server registry, the cross-server broadcaster and the profile service.

**Env is now scoped per role.** `validate-env.ts` keeps the shared lobby+game schema;
`validate-lobby-env.ts`, `validate-game-server-env.ts` and `validate-asset-server-env.ts` hold
the role-specific vars and are imported only by their own role, so each `cleanEnv` call runs
only in the process that needs it. `load-env-file.ts` isolates the `dotenv.config()` side
effect so a role env file can be loaded without dragging in the full schema. New vars:
`LOBBY_PORT` (8080), `GAME_SERVER_PORT` (8090), `GAME_SERVER_NAME`, `ASSET_SERVER_URL`,
`ASSET_SERVER_PORT` (8100), `ASSETS_DIRECTORY`. `RUN_MIGRATIONS_ON_BOOT` and
`GAME_SERVER_PUBLIC_URL` moved out of the shared schema into their roles.

The asset entrypoint builds **its own** minimal Express app (cors + `AssetServerRouter` +
error handler) rather than calling `createExpressApp()`, which pulls in DB-backed route
handlers and the full env. It has no pg pool, no valkey, no auth and no codecs.

**The deployed game server no longer computes facts.** It constructs
`HttpGameplayAssetFactsSource(ASSET_SERVER_URL)` — the 1.4 implementation finally has its real
caller. `ASSET_SERVER_URL` must include the `/api` suffix when the asset server runs with
`NODE_ENV=production`, since `appRoute()` prefixes its routes.

Found while splitting, **not** in the original audit: `loadLadderIntoKvStore()` **deletes** the
ladder key and rebuilds it from postgres. Running it on game server boot would wipe live ladder
state, so it is lobby-only, alongside migrations. Would have been a nasty one to find in prod.

Two things added beyond the sketch:

- **Startup ordering.** The game server cannot boot until the asset server answers, and
  nothing orders them. Rather than dev-only shell sequencing, the facts fetch retries with
  exponential backoff (`ASSET_FACTS_FETCH_MAX_ATTEMPTS`/`_BASE_DELAY_MS` in
  `server/src/consts.ts`), then exits 1 with a clear log. Same behavior in dev and in compose,
  and it does not depend on healthchecks landing in 4.3. The retry wraps only the fetch —
  wrapping all of `createServer` would re-attach a `WebSocketServer` per attempt.
- **Graceful shutdown.** `GameServerNode.shutDown()` calls the
  `unregisterFromGameServerRegistry()` that 2.2 added but never wired; the entrypoint calls it
  on SIGTERM/SIGINT so a stopped container leaves the registry immediately instead of aging out.

`retryWithExponentialBackoff` went into `common/src/utils/` by **extracting** the inline loop in
`client-application/src/connection-topology/index.ts` rather than writing a second copy (Mike
caught that there was already backoff code in there). `attemptReconnectOnce` now rejects instead
of resolving `false`, which removed the boolean plumbing from the reconnect loop.

**Dev is now four terminals**, and `start.sh` is updated: one `yarn build:watch`
(`tsc -b --watch`, the single writer to `dist/`) plus `yarn serve:lobby`,
`yarn serve:game-server`, `yarn serve:asset-server` (each `node --watch dist/entrypoints/…`).
Three `tsc-watch -b` processes would race on the same `dist/` and `.tsbuildinfo`, so the
compile and run jobs that `tsc-watch` bundles had to be split. The only dev-specific delta is
the `--watch` flag; production runs the identical command without it.

`NEXT_PUBLIC_ASSET_SERVER_URL` in `.env.development` moved to `http://localhost:8100`.
Production still points at the combined `/api` route — **still to repoint in 4.4.**

### 3.2 Verify locally with two processes — status: DONE (2026-07-21, verified by Mike)

Run one lobby and two game servers on the host, different ports, before involving Docker.
This isolates "did the split work" from "did the container networking work". Full loop:
create game, start, handoff, play, disconnect, reconnect to the right server.

`dotenv` does not override vars already in the environment, so a second game server needs no
second env file — shell vars win over `.env`:

```
GAME_SERVER_PORT=8091 \
GAME_SERVER_NAME="Alexandria Test Game Server" \
GAME_SERVER_PUBLIC_URL=http://localhost:8091 \
yarn serve:game-server
```

Watch for: both servers appearing in `getLiveServers()`, the selector alternating between them
as games are created, and reconnection resolving the *right* url per game. Also confirm
offline mode still boots — nothing in 3.1 touches it, but it is the standing risk in this plan.

Note this manual pass was, at the time, the *only* coverage of least-busy selection — the
automated test that replaced that gap landed with Phase 4 (see the 2.3 TODO, now closed).

---

## Phase 4 — Docker

### 4.1 Rewrite `client.Dockerfile` — status: DONE (2026-07-21)

`client.Dockerfile` deleted, replaced by `dockerfiles/frontend.Dockerfile`. Builds, boots, serves
`/` at HTTP 200 (next start ready in ~200ms). The `@speed-dungeon/frontend` package (renamed from
`@speed-dungeon/client` at all three layers — dir already was `frontend`, npm name, image tag; the
old name had no importers) pulls siblings two ways, and the Dockerfile mirrors that: `common` is
compiled to `dist` (consumed via the node_modules symlink), while `client-application` and
`game-world-view` are copied as **source** and transpiled by next through the `@/` tsconfig paths.

**The build surfaced three real bugs, none Docker-specific — all latent because nothing had run a
production `next build` since these packages changed.** The frontend uses turbopack in dev
(`next dev --turbopack`) but `next build` is webpack in Next 15; the two bundlers disagree, and the
webpack production path is what exposed all of this:

- **`@gltf-transform/core` was declared in `packages/server` but imported only from
  `packages/common`** (the AssetAnalyzer moved to common in 1.4; the dep never followed). Compiled
  locally via root hoisting and even in the *server* image (which installs server's manifest), but
  the frontend image installs common's manifest without server's, so common's own dep vanished and
  `tsc` failed. Moved the dep to `common`. The server image was rebuilt and re-smoke-tested after
  the move — still fine, since it depends on common.
- **`common` leaked `node:http` into the client bundle.** `incoming-connection-gateway.ts` did
  `import { IncomingMessage } from "node:http"` and used it as a *value* (`instanceof` in
  `queryParamsAuthSessionIdParser`). The single `@speed-dungeon/common` barrel re-exports it, and a
  `"use client"` page importing two constants from that barrel dragged `node:http` into webpack's
  browser build → `UnhandledSchemeError`. `next dev`/turbopack never forced that module into a
  client graph, so it was invisible. Fix: brand `InMemoryConnectionRequest` with
  `isInMemoryRequest: true` and replace the `instanceof` with `Object.hasOwn(request,
  "isInMemoryRequest")` — then `import type`, which tsc elides. **Security note (Mike asked):**
  `Object.hasOwn`, not `in`/`instanceof`, so a real `IncomingMessage` can never look in-memory —
  wire-controlled headers never become own props, and prototype pollution can't forge an own
  property. Behavior is identical to the old check for every real case and strictly fail-closed on
  any unknown request type. This is the pre-existing client/server barrel-coupling smell (the "one
  big barrel" from [[feedback_no_directory_barrels]]) biting; a proper barrel split is deferred.
- **ESLint parser errors during `next build`.** The frontend `.eslintrc.cjs` has no parser; it
  cascades up to the root config, which the image doesn't copy — and the root config does
  type-aware lint over every `packages/*/tsconfig.json`, so copying it would drag the whole
  monorepo in. Set `eslint.ignoreDuringBuilds: true` in `next.config.mjs`. Type-checking still runs
  and still fails the build; lint stays a CI/editor concern. This changes local `next build` too,
  not just Docker — output is byte-identical.

Runtime stage is deliberately unoptimized: it carries the whole built workspace so every
`@speed-dungeon/*` symlink resolves. `next output:"standalone"` would trim it to a traced minimal
set — deferred, noted inline.

### 4.2 Audit `server.Dockerfile` — status: TODO

Its `rm tsconfig.tsbuildinfo` / `rm -rf ./dist` before building common are no longer needed —
that existed to work around the `tsconfig.build.json` exclude bug fixed 2026-07-21. Harmless in
a fresh build context either way, but the comment they imply is now misleading.

Its `CMD ["node", "dist/index.js"]` is already wrong — `src/index.ts` is a barrel of exports,
not an entrypoint. One image can serve all three roles; the role is chosen by the compose
`command:` (`dist/entrypoints/lobby.js` etc). The asset role wants a volume or bind mount for
`ASSETS_DIRECTORY` rather than the baked `COPY packages/server/assets`, and the game server
image needs no assets at all now (1.4).


Builds `common` then `server`; copies the root `tsconfig.json`. Watch the root tsconfig — it
has `declaration: true`, no `outDir`, and no include/exclude, so anything that runs `tsc -b`
against it emits artifacts into every `src/`. The Dockerfile currently only does
`tsc -p tsconfig.build.json` in common and plain `tsc` in server, which is fine; just do not
"simplify" it to a root build.

### 4.2 Audit `server.Dockerfile` — status: DONE (2026-07-21)

Rewritten as one build with two final targets, `--target server` (lobby + game server, no asset
binaries) and `--target asset-server` (same image + the 42MB asset set on top). Role is chosen by
the compose `command:`, not the image. Both targets build; the asset image was booted and
confirmed to run the gltf analysis (~2s) and serve `/api/asset-manifest` and
`/api/gameplay-asset-facts`. `wget` and node's `net` are both present in `node:22-alpine` for the
compose healthchecks.

What the build surfaced, none of it in the audit:

- **`packages/server` imports `cors` but never declared `@types/cors`.** It compiled locally only
  because `frontend`'s dead `socket.io` 4.7.5 dep pulls `@types/cors` in transitively and Yarn
  hoists it to the root. The image installs only the common+server manifests, so the phantom
  vanished and `tsc` failed. Added `@types/cors` to `packages/server` devDeps. **This means
  deleting the dead `socket.io` dep (frontend) would break the local server build** — the two are
  now decoupled, but do the socket.io removal and this fix together, not separately.
- **`yarn.lock` was never copied into the old image** — `--pure-lockfile` had no lockfile to honor.
  Now copied in every deps stage.
- **No `.dockerignore` existed.** `COPY packages/common/` was pulling host `node_modules`, `dist`,
  and every `.env` (including `TOKENS_SECRET` and DB creds) into the build context and image
  layers. Added one; it re-allows only `frontend/.env.production` (public `NEXT_PUBLIC_*` urls,
  baked by next at build time).
- Stages must be lowercase to be usable in `FROM x AS y`; the old `deployDeps`/`buildDeps` worked
  only because they were referenced via `COPY --from`, which is laxer. Renamed to
  `deploy-deps`/`build-deps`.
- Runs as `USER node`, `NODE_ENV=production` baked in.

**Docker Hub tag shape changes.** Old: one `snowd3n/speed-dungeon:server` (combined process). New:
`:server` (lean) + `:asset-server` + the client image. The box-level compose still expects the old
combined `:server`, so the cutover and the box-level compose edit (4.3) must land together.

### 4.3 Replace the compose files — status: DRY-RUN PASSED (2026-07-22)

`docker-compose.deploy.yml` rewritten as speed-dungeon's own project: lobby, two game servers,
asset server, postgres, valkey. **Brought up end to end locally and the whole internal wiring
converged clean.** What the dry run proved:

- **Ordering/healthchecks work.** postgres + valkey healthy → asset-server healthy (only after the
  gltf analysis finishes, which is what its `/api/asset-manifest` healthcheck gates on) → game
  servers and lobby start. No crash loops, no restarts.
- **Migrations ran on the lobby only** (all four UP, "Migrations completed successfully"); game
  servers did not migrate.
- **Cross-container asset facts fetch works.** Both game servers fetched
  `http://speed-dungeon-asset-server:8100/api/gameplay-asset-facts` on attempt 1 of the backoff and
  came up healthy (WS port only opens after `createServer`, which needs that fetch).
- **Both game servers registered into the shared Valkey registry** with their public urls
  (`Lindblum → wss://.../game-server-1`, `Alexandria → .../game-server-2`), and the **heartbeat
  refreshes `lastSeenAt`** every `GAME_SERVER_HEARTBEAT_MS` (10s) — checked over a full interval.

`env_file` is `.env.deploy` (now gitignored via an explicit rule — the old `**/*.env` pattern did
NOT match `.env.deploy`; that was a latent secret-leak trap). Committed `.env.deploy.example`
template alongside. `docker network create speed-dungeon-shared` is required before `up` (external
network for snowauth); created locally for the run.

**Not exercised (needs 4.4 + a real client):** the public-url handoff path. The registered urls are
`wss://roguelikeracing.com/...` placeholders that don't resolve until nginx exists, and no client
was driven, so least-busy *selection* is still only covered by the integration test, not a live
handoff. Also **no frontend service in this compose yet** — the dry run was backend wiring only.

Still needs before real deploy:

- a `.env.deploy` file (gitignored) with the secrets and public urls
- `docker network create speed-dungeon-shared` on the VPS, joined by the lobby, for snowauth
  (4.3b)
- the box-level `packages/server/deploy.docker-compose.yml` to stop managing speed-dungeon
- 4.4 nginx routes before `GAME_SERVER_PUBLIC_URL`/asset urls resolve

Host ports chosen to dodge the box-global ones already taken (3000-3002, 8082, 8084): lobby 8083,
game servers 8085/8086, asset 8087. Uses YAML anchors (`x-server-common`, `x-infra-env`); the
shallow-merge trap means both game servers restate their full `depends_on` rather than extending
it — that repetition is load-bearing, not sloppiness.

### 4.3 (original notes) — status: superseded by the above

**Decided: speed-dungeon gets its own compose file**, and the existing box-level one stops
managing it. Multiple compose projects coexist fine on one VPS — each gets its own network
and lifecycle, so the personal site and the older apps keep running untouched.

Current state being replaced:

- Root `docker-compose.deploy.yml` has no postgres, no valkey, no `env_file`.
- `packages/server/deploy.docker-compose.yml` is the real VPS one, whole-box: it also brings
  up the personal site, the older roguelike-racing app, and snowauth alongside speed-dungeon.

New compose: lobby, `game-server-1`, `game-server-2`, asset server, postgres, valkey. Each
game server gets its own name/url/port env. Add healthchecks and `depends_on` so game servers
do not register before postgres/valkey are up.

Two things to watch with separate compose projects:

- **Host port collisions.** Every published port is box-global. Keep a list; the existing
  apps already hold 3000–3002, 8082–8084.
- **Cross-project networking for snowauth** — see 4.3b.

### 4.3b Reaching snowauth from a separate compose project — status: TODO

The server calls snowauth over HTTP for every logged-in connection
(`get-logged-in-user-option.ts:15`, plus `get-usernames-by-user-ids.ts` and
`get-user-ids-by-username.ts`), authenticating with `INTERNAL_SERVICES_SECRET` sent as a
cookie. snowauth lives in the *other* compose project, so container-name DNS
(`http://snowauth-server:8081`) will not resolve across projects by default.

Two options:

- **Shared external docker network.** `docker network create shared`, declare it as
  `external: true` in both compose files, attach snowauth-server and the speed-dungeon lobby
  to it. Container-name DNS then works and the internal-secret traffic never touches the
  host's published ports. Preferred.
- **Via the host's published port** (`http://<host-gateway>:8084`). Works with no changes to
  the other compose file, but sends the internal secret over the host interface and depends
  on snowauth staying published.

Note this is a *lobby* concern, not a game server one — identity resolution happens on the
lobby's connection handler. Only the lobby needs the shared network.

New compose: lobby, `game-server-1`, `game-server-2`, postgres, valkey, proxy. Each game
server gets its own name/url/port env. Add healthchecks and `depends_on` so game servers do
not register before postgres/valkey are up.

### 4.4 Reverse proxy — status: WRITTEN, UNTESTED (2026-07-22)

`packages/server/nginx.conf` rewritten for the split. Route map (host-published ports):

| path | backend | port | kind | client env |
|------|---------|------|------|-----------|
| `/` | frontend (next) | 3002 | HTTP | — |
| `/lobby` | lobby | 8083 | WS | `NEXT_PUBLIC_WS_SERVER_URL` |
| `/api` | lobby | 8083 | HTTP | `NEXT_PUBLIC_GAME_SERVER_URL` |
| `/game-server-1` | game (Lindblum) | 8085 | WS | `GAME_SERVER_PUBLIC_URL` (server-side) |
| `/game-server-2` | game (Alexandria) | 8086 | WS | `GAME_SERVER_PUBLIC_URL` (server-side) |
| `/asset` | asset | 8087 | HTTP | `NEXT_PUBLIC_ASSET_SERVER_URL` |
| `/auth` | snowauth | 8084 | HTTP | `NEXT_PUBLIC_AUTH_SERVER_URL` |

Design decisions, both made because the client urls are **baked into the frontend image at build
time**:

- **Lobby WS gets its own path `/lobby`** rather than sharing `/` with the frontend. Splitting
  WS-upgrade-vs-GET at the same path needs a `map $http_upgrade`, which must live in the `http`
  context — but `nginx.conf` here is a `server {}` block included into it, so a `map` can't go in
  this file. A dedicated path sidesteps that entirely (and avoids the fragile `if` alternative).
  Changed `NEXT_PUBLIC_WS_SERVER_URL` from the bare host to `.../lobby`. `new WebSocket()` accepts
  an `https://` url and normalizes it to `wss://`, so no scheme handling needed.
- **Asset server gets a dedicated `/asset` prefix**, rewritten to the container's internal `/api`
  (`proxy_pass http://localhost:8087/api/`). The rewrite is a transparent whole-prefix swap, so
  whatever assetId convention already worked under `/api` is preserved. `/asset/assets/` is a
  more-specific location than `/asset/` so it wins the match for asset bytes; the manifest/facts
  fall through to `/asset/`. Changed `NEXT_PUBLIC_ASSET_SERVER_URL` to `.../asset` and the (dead)
  `NEXT_PUBLIC_ASSET_BASE_PATH_3D` to `.../asset/assets/` for consistency.

`/socket.io/` (dead socket.io leftover) removed. Each WS location carries the upgrade headers and a
3600s read/send timeout so idle sockets are not dropped at nginx's default 60s. Added `Host` and
`X-Forwarded-Proto` to every location — neither is read by the app today (verified by grep), kept
as standard hygiene for `/auth` and future backends.

**Asset caching — deliberately NOT added**, against the original plan's "give it cache headers."
Asset urls are path-keyed, not content-hashed, and the client already caches in IndexedDB keyed by
the manifest version. A long browser `max-age` would let a browser serve stale bytes for an
unchanged url after a redeploy that changed that asset, defeating the manifest-hash cache-bust. The
right move is `Cache-Control: immutable` **once asset urls carry a content hash** — noted inline in
the conf. Left as a follow-up, not a wasteful omission.

**Untested — needs the real box.** No local nginx run (the routes point at host-published ports
that only exist on the VPS with the stack up, and TLS is certbot-managed for the real domain).
**The frontend image must be rebuilt** for the three changed `NEXT_PUBLIC_*` values to take effect —
they are baked at build time, so the image built on 2026-07-21 still has the old urls.

---

## Deferred — dependency and toolchain sweep

Nothing has been updated in roughly 18 months. Noticed while pinning the Docker base image:
the repo had **no** `engines` field, so the Node version was whatever each machine happened to
have. Added `"node": ">=22"` to the root `package.json`; the Dockerfile pins the major
(`22-alpine`) and should be kept in step with it.

Worth a deliberate pass after the deploy works, not during it: node 22 → current LTS, the
`node:22-alpine` tag → a digest if reproducible builds are wanted, express 4 → 5, and the
jest/ts-jest devDeps still sitting in `packages/server/package.json` even though the project
moved to vitest. Do this on its own branch with the integration suite as the safety net.

## Deferred — dynamic provisioning

Once the static pool works, `GameServerFleetManager` gets a Docker implementation:
threshold policy (e.g. all live servers above N games) triggers a spawn. Requires the docker
socket, ideally via a small fleet-manager sidecar that owns the socket and exposes a narrow
internal API rather than mounting it into the lobby. Routing for spawned containers is the
real work — Traefik/Caddy label-based auto-routing, or allocating from a port pool.

With the asset facts document (1.4), game server images carry no asset binaries and boot
without parsing gltf, so cold start is no longer a strong objection. The remaining objections
are the docker socket and the routing — both real, but narrower than before.

Do not start this until a party can be handed off to, and reconnect to, a second static game
server on the VPS.

---

## Log

Append dated entries as steps land — what changed, what broke, what surprised us.

- 2026-07-22 — **Deploy shape changed: folded into the single box compose, dropped the
  separate-project + OS-upgrade plans.** Briefly considered a full VPS upgrade (Ubuntu 18 → 24,
  compose v1 → v2) via fresh-box migration, then dropped it — "just get it working as is." The
  real box compose (`vps.docker.yml`, which Mike copied in — the repo's
  `packages/server/deploy.docker-compose.yml` was **stale/not live**) revealed more services than
  the audit knew: `twistgame` (3008) and **battle-school/lucella** (3005 client, **8085 server**).
  8085 collided with the game-server-1 port I'd picked, so game-server-1 moved to **8088**
  (compose + nginx both updated).

  **What we actually did:** folded the split roles (frontend, lobby, 2 game servers, asset) into
  `vps.docker.yml`, replacing the old combined `speed-dungeon-client`/`-server`, reusing the box's
  `.speed-dungeon-env`. Because it's one compose project, snowauth is reachable at
  `http://snowauth-server:8081` with **no shared network** (4.3b is moot for this box). Bumped the
  file to format `2.4` for health-gated `depends_on` under v1. Per Mike: **destroy speed-dungeon's
  pg data, keep snowauth accounts** — so the SD pg volume is wiped on deploy, no data migration.
  Final box host ports (all unique, verified): 3000 personal, 3002 SD-frontend, 3005 bs-client,
  3008 twistgame, 8083 SD-lobby, 8084 snowauth, 8085 bs-server, 8086 SD-game-2, 8087 SD-asset,
  8088 SD-game-1.

  **Superseded (kept, not deleted):** `docker-compose.deploy.yml` (separate-project variant, still
  valid + dry-run-verified if we ever want it), `.env.deploy`/`.env.deploy.example` (the example
  still documents the env vars `.speed-dungeon-env` must now carry), and the earlier edits to the
  stale `packages/server/deploy.docker-compose.yml`.

  **Deploy steps on the box (docker-compose v1):**
  1. `docker push snowd3n/speed-dungeon:{server,asset-server,frontend}` (only built locally so far).
  2. Update `.speed-dungeon-env` on the box to include `TOKENS_SECRET` and `INTERNAL_SERVICES_SECRET`
     (new images require them) plus the existing shared DB/valkey/FRONT_END_URL/NODE_ENV vars.
  3. Replace the box's nginx site with `packages/server/nginx.conf`; `nginx -t && systemctl reload nginx`.
  4. Wipe the SD pg volume for a fresh DB: `docker-compose down && docker volume rm <project>_speed_dungeon_pg_volume`.
  5. `docker-compose pull && docker-compose up -d` (uses `vps.docker.yml`).
  6. Verify: migrations ran on lobby, both game servers registered + heartbeat, a real client can
     log in (snowauth), create a game, and get handed to `wss://roguelikeracing.com/game-server-N`.

- 2026-07-22 — **4.4 nginx written.** Dedicated paths for the lobby WS (`/lobby`) and asset server
  (`/asset`) rather than sharing `/` and `/api`. The forcing reason for `/lobby` was structural,
  not aesthetic: the WS-vs-GET split at `/` needs a `map`, which can't live in a `server {}` block,
  and this conf IS a server block. Both choices changed baked `NEXT_PUBLIC_*` urls, so **the
  frontend image needs a rebuild** before deploy. Chose not to add asset cache headers despite the
  plan asking for them — path-keyed urls + the client's version-keyed IndexedDB cache make a long
  `max-age` a stale-asset trap across redeploys; the correct fix is content-hashed urls +
  `immutable`, deferred. Nothing here could be tested locally (host-published ports + certbot TLS
  live only on the VPS). Phase 4 code is now all written; what remains is box-side: the compose
  cutover, the shared network on the VPS, a frontend rebuild+push, and a real end-to-end run.

- 2026-07-21 — **4.1 + 4.2 done, images build and run.** All three images (lean server, asset
  server, frontend) build from scratch, boot, and answer. The recurring lesson this session:
  **splitting the install by package turns every undeclared-but-hoisted dependency into a build
  failure.** Three of them fell out — `@types/cors` (server, from frontend's dead socket.io),
  `@gltf-transform/core` (declared on server, imported by common), and the `node:http` value-use
  leaking through common's barrel into the client webpack bundle. None showed up locally because
  Yarn hoists everything to the root and nobody had run a production `next build` in a long time.
  Each fix was at the source (declare the dep where it's used; don't use a node builtin as a value
  in client-reachable code), not a Docker workaround. The `node:http` one is the interesting one:
  dev (turbopack) and build (webpack) genuinely differ, and only the production build path found
  it. Also renamed the frontend package/image to `frontend` across all three layers. Next: the
  `.env.deploy` template and running the compose stack end to end (4.3).

- 2026-07-21 — **3.2 verified by Mike; least-busy selection now has automated coverage.** Four
  cases in `game-server-selection/`: fewest-games wins, pending setups count, a stale server is
  skipped, and `NO_LIVE_GAME_SERVERS` reaches the client as an error. The third case asserts a
  count-based pick rather than alternation — with one game each, the next game goes back to the
  first server, which round-robin would get wrong. Two small seams opened to make client-output
  assertions possible: `ConnectionTopology.gameServerUrlOption` and the fixture's
  `gameSessionStoreService` getter. Worth remembering from the pending-setup case: the state a
  test needs to observe may only exist transiently in the real flow, and the fix is to hold the
  flow still (pause the transport) rather than to fabricate the state or assert into a race.

- 2026-07-21 — **Two build-config traps fixed while getting that test to run**, both of which had
  been costing time for a while. `packages/common/tsconfig.build.json` specified `exclude`, which
  replaces TypeScript's default exclude *entirely* — including the part that keeps `outDir` out of
  the inputs. So `dist/*.d.ts` were compiler input and every build overwrote its own output
  (TS5055). Now lists `node_modules` and `dist`; inputs dropped 4131 → 2887 and `common` rebuilds
  in place without deleting `dist`. Second trap: deleting `dist` without deleting
  `tsconfig*.tsbuildinfo` makes `tsc` exit 0 and emit nothing, which matters because the
  integration tests resolve `@speed-dungeon/common` to `dist`, not `src` — a green suite can be
  testing the last successful build. Both written up in the README's common-errors list.
- 2026-07-21 — **Stale game server pruning implemented and tested.** 2.1 specified it and 2.1
  even added `getAllServers()` for it, but the block was never written — a specified step that
  everything downstream *looked* fine without, because `getLiveServers()` filters stale entries
  so selection was already correct. Only the leak was missing. Worth remembering that "the
  feature works" is not evidence the spec was fully implemented. The test lives in
  `server-crashes/`, whose `notes.ts` had already sketched this exact genre (write a record,
  never refresh it, advance past the threshold) for active game records — the game server
  record is the same shape.
- 2026-07-21 — **2.5 and 3.1 done. Phase 2 complete, the process is split.** 2.5 turned out to
  be already satisfied by 2.3/2.4 — verified, not written. The surprise in 3.1 was
  `loadLadderIntoKvStore()`: it `del`s the ladder key and rebuilds, so a game server running it
  on boot would wipe live ladder state. Nothing in the audit flagged it, because in one process
  the question of "which role owns this" never came up. Worth generalizing — the split's real
  risk is not the wiring, it is **boot-time side effects that were only ever safe because there
  was exactly one process running them**. Migrations were the known one; the ladder rebuild was
  the unknown one. Two corrections from Mike: I reached for memoized shared services so a
  combined dev entrypoint could work, and he pointed out that if dev is going to run separate
  processes anyway (matching prod, minimizing dev-specific code) then the memoization is
  solving a problem we should not have — main.ts got deleted instead. He also caught that
  backoff code already existed in `connection-topology`, so the new util is an extraction of it
  rather than a second implementation.
  **Verified 2026-07-21 by Mike:** integration suite passes, and connecting and reconnecting to
  games both work with the lobby, game server and asset server running as three processes.
- 2026-07-21 — **2.3 and 2.4 done.** 2.3 verified by Mike in manual dev testing (joining games
  and reconnecting both still work with live selection). 2.4 deletes the static url record, so
  it needs the same check plus the integration suite before Phase 2 is called done. Only 2.5
  remains, and most of it got absorbed into 2.3/2.4 as the construction sites were touched.
- 2026-07-21 — **Reversed the self-reported game count** (see 2.2). Mike pushed back after it
  was already built: why maintain a counter when the active game records can just be counted?
  Correct, and the performance case for reporting evaporated once I checked — that scan
  already runs every 10s in the cleanup loop. The general lesson is the one worth keeping:
  I optimized the cheap axis (a hash read vs a scan) and paid for it on the expensive one
  (a denormalized value that can silently disagree with the truth). Took `PendingGameSetup`
  along for the ride, which also closes the in-flight-games gap.
- 2026-07-21 — **2.1 and 2.2 done.** Additive so far: the registry exists and game servers
  report into it, but nothing reads it yet, so behavior is unchanged. `GameServer` construction
  sites touched again (url param) — that is four sites for the second time this phase, worth
  remembering when weighing constructor params against a parameter object if it grows further.
  **Not yet run:** tests / offline since 2.2.
- 2026-07-21 — **Phase 2 designed** (see above, sketched before writing code as with 1.4).
  Mike's calls: `GameServerStatus` over `GameServerRegistration` (parallel to
  `ActiveGameStatus`); stale pruning in the dangling-resources loop rather than inside the
  selector, since a selection method should not silently mutate the store; and
  `activeGameCount` pushed on game-open/game-close events rather than derived on the
  heartbeat, which also makes it accurate immediately instead of up to one heartbeat stale.
  Verified while designing: `cleanUpGame` really is the centralized close path, and a
  handed-off game nobody joins is never registered on the game server at all.
- 2026-07-21 — **1.5 done. Phase 1 complete.** Nothing surprising. Found `BASE_FILE_PATH` /
  `NEXT_PUBLIC_ASSET_BASE_PATH_3D` to be entirely dead; left in place rather than widening the
  step. Next: Phase 2, the server registry.
- 2026-07-20 — **1.4 code done.** Two naming corrections from Mike mid-implementation, both
  the same underlying point: things named for the game server were no longer game server
  things. `AssetAnalyzer.load()` became a plain `GameplayAssetFacts` object passed by
  constructor (see 1.4), and `GameServerNodeAssetService` became `LocalStoreAssetService`.
  Worth remembering the pattern — when moving a responsibility between services, check the
  names that travel with it, not just the wiring.
  **Verified 2026-07-21:** integration suite passes and offline mode works.
- 2026-07-20 — **1.3 done, and the original audit item was wrong.** Mike asked why migrating
  on every lobby boot is actually a problem, which was the right question — checking
  node-pg-migrate showed it locks by default, so "migration race" was overstated. Real failure
  mode is `process.exit(1)` crash loops on parallel boot, and it only bites game servers.
  Ended up with a much smaller change than planned: one env flag, no init container. Lesson
  worth keeping: verify the library's actual behavior before designing around a hazard.
- 2026-07-20 — **1.2 done.** Small. One judgement call worth revisiting: added a hard throw
  when `MANUAL_TEST_MODE` is on under `NODE_ENV=production`, which was not strictly asked for.
  Cheap insurance given what that flag serves, but it is a deliberate extra.
- 2026-07-20 — **1.1 done.** No surprises. Worth recording: the failure mode was not actually
  silent, it was *late* — a mismatched secret throws `INVALID_TOKEN` at handoff, which reads
  like a token bug rather than a config bug. Hence `assertUsableSecret()` at boot. Also note
  `SodiumHelpers.encrypt` takes the secret as a base64 string and calls `from_base64` on every
  call, so the env value must be base64 with padding (libsodium `ORIGINAL` variant) —
  `openssl rand -base64 32` produces exactly that.

- 2026-07-20 — Plan written. Audit found: per-process token secret, static
  `gameServerUrlRegistry` breaking reconnection to new servers, dead `client.Dockerfile`,
  hardcoded asset url in `create-client-application.ts`, asset router attached to lobby
  Express from the game node, migrations on every boot, no game server route in nginx,
  stale compose files.
- 2026-07-20 — Better approach for 1.4 (Mike's): rather than splitting the asset *set* by
  consumer, run the gameplay-relevant analysis on the asset server and serve the result as a
  hashed facts document that game servers fetch and cache. Game server images then carry no
  asset binaries at all, and boot stops parsing gltf. Fits existing code: analyzer output is
  already plain serializable records with a public setter, and `AssetVersionData` already
  carries `{ sizeBytes, hash }`. Side effect: weakens the cold-start argument against dynamic
  provisioning, so revisit that once this lands.
- 2026-07-20 — Settled the 1.4 shape: a real `AssetServer` class in common, peer of
  `LobbyServer`/`GameServer`, over parameterizing `AssetAnalyzer`. `RemoteAssetStore` is
  already an abstract class with a non-HTTP impl in the test fixtures, so offline reuses a
  proven seam rather than a new one. Recompute is startup-only; restart everything to change
  an asset. Also audited offline mode against the whole plan — 1.4 was the only real break,
  1.1 and 2.4 need care.
- 2026-07-20 — Decisions: dedicated asset container (assets will grow with sounds/textures);
  speed-dungeon gets its own compose file separate from the box-level one. Follow-ons found:
  game servers still need gameplay-relevant assets on local disk for
  `analyzeAssetsForGameplayRelevantData()`, so the asset *set* may want splitting by consumer
  (4.1/1.4); and snowauth lives in the other compose project, so the lobby needs a shared
  external docker network to reach it by container name (4.3b).
- 2026-07-20 — Correction: roguelikeracing.com is this project's domain, not a leftover from
  another app. `.env.production` urls and `nginx.conf` are current production config, not
  stale. The genuinely stale bits are narrower: the `/socket.io/` nginx location and the
  dead client image reference.
