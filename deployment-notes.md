# VPS Deployment Plan

Working notes for moving speed-dungeon from local dev to a Docker Compose deploy on a VPS,
including running more than one game server.

Update the status markers and the log at the bottom as steps land.

---

## Where we are now

`packages/server/src/main.ts` runs **both server nodes in one process**:

- lobby on port 8080 (Express + ws)
- game server on port 8090 (bare http server + ws), sharing the lobby's Express app
- one PG pool, one Valkey connection, one in-memory token secret

Everything below exists because that single process has to become two roles in separate
containers before a second game server is possible.

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

### 1.5 Fix client-side hardcoded urls — status: TODO

- `frontend/src/app/create-client-application.ts:24` hardcodes
  `new RemoteServerAssetStore("http://localhost:8080")`, ignoring
  `NEXT_PUBLIC_ASSET_SERVER_URL`.
- `.env.production` defines no `NEXT_PUBLIC_ASSET_SERVER_URL`, so there is nothing for it to
  read once the hardcode is removed. It should point at the dedicated asset container's
  public route (see 1.4). (The `roguelikeracing.com` urls in that file are correct — that is
  this project's domain.)

---

## Phase 2 — the server registry

### 2.1 `GameServerRegistry` interface + Valkey impl — status: TODO

Shape: `{ name, url, activeGameCount, lastSeenAt }` keyed by `GameServerName`.

- `register(entry)` / `heartbeat(name, activeGameCount)` / `getLiveServers()` / `deregister(name)`
- Staleness follows the `ActiveGameStatus.isStale()` precedent: stale after two heartbeat
  durations (`GAME_RECORD_HEARTBEAT_MS * 2`).
- In-memory impl for offline/single-player and integration tests, mirroring how
  `GameSessionStoreService` already has both. Offline pre-populates it with its one local
  game server — see the offline section.

Note from prior work: the Valkey impls cannot be integration-tested under fake timers
(node-redis hangs). Test against the in-memory impl.

### 2.2 Game server heartbeats into the registry — status: TODO

Register on startup after `analyzeAssetsForGameplayRelevantData()` resolves (do not advertise
before assets are ready), then a `HeartbeatTask` on the existing scheduler. Deregister on
graceful shutdown.

Each game server needs to know its own externally reachable url — env var, since only the
deploy knows it.

### 2.3 `getLeastBusyGameServer` reads the registry — status: TODO

Replaces the stub at `lobby-node/index.ts:65`. Picks the live server with the lowest
`activeGameCount`. Throws a clear error if none are live — that error surfacing at handoff
time is the whole point of registering only when ready.

### 2.4 Reconnection resolves urls from the registry — status: TODO

Replace `gameServerUrlRegistry` in `LobbyServer`'s constructor and
`reconnection/index.ts:136` with a registry lookup. Removes the static record entirely.

---

## Phase 3 — split the process

### 3.1 Two entrypoints — status: TODO

`main.ts` becomes three role entrypoints — lobby, game server, asset server — sharing a
bootstrap module. Prefer separate entrypoints over a `SERVER_ROLE` branch: the role is a
deploy-time fact, not a runtime one, and it keeps each container's startup readable.

The asset entrypoint is the smallest by far: Express app + `AssetServer`, no pg pool, no
valkey, no auth, no token codecs. Its `validate-env` needs should be scoped down accordingly
rather than sharing the full env schema, so a missing `DATABASE_URL` cannot stop the asset
container from booting.

Also removes the awkward `GAME_SERVER_NAME` import from `main.js` into `lobby-node/index.ts`
and `manual-test-mode-config.ts` — the name becomes env config per game server container.

### 3.2 Verify locally with two processes — status: TODO

Run one lobby and two game servers on the host, different ports, before involving Docker.
This isolates "did the split work" from "did the container networking work". Full loop:
create game, start, handoff, play, disconnect, reconnect to the right server.

---

## Phase 4 — Docker

### 4.1 Rewrite `client.Dockerfile` — status: TODO

It is currently dead: it copies `packages/client`, which no longer exists (the package is
`frontend`), and does not know about `client-application` or `game-world-view`. It cannot
build as written.

### 4.2 Audit `server.Dockerfile` — status: TODO

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

- 2026-07-20 — **1.4 code done.** Two naming corrections from Mike mid-implementation, both
  the same underlying point: things named for the game server were no longer game server
  things. `AssetAnalyzer.load()` became a plain `GameplayAssetFacts` object passed by
  constructor (see 1.4), and `GameServerNodeAssetService` became `LocalStoreAssetService`.
  Worth remembering the pattern — when moving a responsibility between services, check the
  names that travel with it, not just the wiring.
  **Still to verify:** offline mode boots, and the integration suite passes (fixture asset
  caching was rewritten). Neither run yet.
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
