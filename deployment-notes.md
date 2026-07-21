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

### 3.2 Verify locally with two processes — status: TODO — **next**

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

---

## Phase 4 — Docker

### 4.1 Rewrite `client.Dockerfile` — status: TODO

It is currently dead: it copies `packages/client`, which no longer exists (the package is
`frontend`), and does not know about `client-application` or `game-world-view`. It cannot
build as written.

### 4.2 Audit `server.Dockerfile` — status: TODO

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

### 4.3 Replace the compose files — status: TODO

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

### 4.4 Reverse proxy — status: TODO

`packages/server/nginx.conf` is this project's live production config (roguelikeracing.com is
our domain), and it mostly works: `/` to the client on 3002, `/api` to the server on 8083,
`/auth` to snowauth on 8084, TLS via certbot. Two problems for this work:

- the `/socket.io/` location is a leftover from the older socket.io-based server; this
  project uses raw ws, so the WS upgrade block is on a path nothing connects to
- there is no route to any game server — only the combined 8083 process is proxied

Needs a working WS upgrade route for the lobby, a route per game server, a route for the
asset container, and TLS so the client gets `wss://`.

The asset route is the one worth tuning: it is plain static bytes, so give it cache headers
and let nginx do the work. `AssetServer.serveAsset` currently reads through the store and
sends a buffer with no caching headers at all — fine for dev, wasteful for a growing asset
set over the public internet.
The url each game server advertises in the registry must be its public proxy url, not its
container address.

---

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
  rather than a second implementation. **Not yet run:** the integration suite, offline mode, or
  a real multi-process boot — that is 3.2.
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
