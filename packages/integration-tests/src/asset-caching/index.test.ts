import { AssetId, ClientAppAssetService } from "@speed-dungeon/common";
import { IndexedDbAssetStore } from "@speed-dungeon/common";
import { RemoteServerAssetStore } from "@speed-dungeon/common";
import { GameServerNodeAssetService } from "@speed-dungeon/common";
import { AssetServer, NodeFileSystemAssetStore } from "@speed-dungeon/server";
import { indexedDB as fakeIndexedDB } from "fake-indexeddb";
import { createExpressApp } from "./create-test-express-app.js";

export const ASSET_CACHE_TEST_PORT = 8085;

//
describe("asset management", () => {
  // if online
  // - if not cached, http fetch
  // - if cached but cache entry marked as willUpdate, http fetch
  // - use cached
  // if offline
  // - we should only allow offline play if cache contains all game assets
  // - check cache for asset
  // - if somehow not cached, display error "unable to load resource, please connect to the internet"
  //
  //  on client startup
  //  - if cache contains all game assets, allow "offline mode" option
  //  - await connection
  //  - fetch list of updated asset names/logical paths and file sizes
  //  - create an AssetUpdateProgressTracker from this list (for user facing progress bars)
  //  - mark cached assets as willUpdate if they have new versions available
  //  - create AssetPreFetchQueue of all uncached or updatable assets
  //    - AssetId
  //    - Priority
  //  - sort the AssetPreFetchQueue by each assetId's pre-defined default priority (PreFetchLow, PreFetchHigh)
  //    where most are PreFetchLow but we keep some short-list of PreFetchHigh AssetIds
  //  - define some TARGET_CONCURRENT_FETCH_COUNT = 2; (or whatever is a good target number)
  //    which specifies how many concurrent fetches to strive for during pre-fetch but may be exceeded
  //    if many urgent AssetFetch are started
  //  - pop the top TARGET_CONCURRENT_FETCH_COUNT entries from the pre-fetch queue and create an AssetFetch for each
  //    - AssetId
  //    - Priority
  //    - Promise<ArrayBuffer>
  //    - AbortController
  //
  //  on game needs asset
  //  - if assetId in AssetFetch list
  //    - already fetching, all we can do is await it to finish
  //  - if assetId cached
  //    - check if marked as willUpdate (would be done in the prefetch initialization on app startup)
  //    - if not, use cached asset
  //  - if cached and marked as willUpdate, but offline (could happen if we fetch update list
  //    then disconnect before fetching assets)
  //    - use cached asset
  //  - if assetId not cached or cached and marked as willUpdate
  //    - send abort signal to all assets in the ongoing AssetFetch list not marked
  //      as Urgent for their priority
  //    - for each AssetFetch that was cancelled, create an AssetPreFetch and put it back
  //      in the pre-fetch queue
  //    - for the needed asset, remove matching assetId record from pre-fetch queue
  //    - create an AssetFetch for this assetId and mark as Urgent priority
  //
  //  on fetch progress event
  //  - if it is Urgent priority, update the corresponding entry in the AssetUpdateProgressTracker
  //    with the new percent complete
  //  - if not Urgent, it may be cancelled, so only update AssetUpdateProgressTracker if 100% complete
  //
  //  on fetch complete
  //  - if the AssetFetch list size is < TARGET_CONCURRENT_FETCH_COUNT and
  //  pre-fetch queue is not empty, pop the next entry from the pre-fetch queue
  //  and start a new AssetFetch

  it("asset prefetch", async () => {
    // const testServerUrl = `http://localhost:${ASSET_CACHE_TEST_PORT}`;
    // const remoteStore = new RemoteServerAssetStore(testServerUrl);
    // const cache = new IndexedDbAssetStore(fakeIndexedDB);
    // // @TODO - need real asset list
    // const assetsByDefaultFetchPriority = new Map();
    // const isOnline = () => true;
    // const clientAppAssetService = new ClientAppAssetService(
    //   remoteStore,
    //   cache,
    //   assetsByDefaultFetchPriority,
    //   isOnline
    // );
    // const baseAssetDirectory = "packages/server/assets/";
    // const localFileSystemStore = new NodeFileSystemAssetStore(baseAssetDirectory);
    // const gameServerNodeAssetService = new GameServerNodeAssetService(localFileSystemStore);
    // const expressApp = createExpressApp();
    // const assetServer = new AssetServer(localFileSystemStore);
    // assetServer.attachRouter(expressApp, { isProduction: false });
    // expressApp.listen(ASSET_CACHE_TEST_PORT, () => {
    //   console.info("started listening for asset requests");
    // });
    // await clientAppAssetService.initialize();
    // await clientAppAssetService.scheduleAssetUpdates();
    // const fullUpdatePromise = clientAppAssetService.startAssetUpdatesPrefetch();
    // const firstUrgentAssetId = "monsters/wolf-full.glb";
    // clientAppAssetService.getAsset(firstUrgentAssetId as AssetId);
    // const urgentAssetIds = [
    //   "monsters/old/velociraptor-full.glb",
    //   "monsters/old/velociraptor-main-skeleton (copy 1).glb",
    //   "monsters/old/velociraptor-main-skeleton.glb",
    //   "monsters/old/wolf-full.glb",
    //   "monsters/old/wolf-main-skeleton.glb",
    //   "monsters/spider-full.glb",
    //   "monsters/spider-main-skeleton.glb",
    //   "monsters/wolf-main-skeleton-pre-on-summoned.glb",
    //   "monsters/wolf-main-skeleton.glb",
    // ].map((item) => item as AssetId);
    // for (const assetId of urgentAssetIds) {
    //   clientAppAssetService.getAsset(assetId);
    // }
    // await fullUpdatePromise;
    // // to test:
    // // - after full update, able to find an asset that was preempted/aborted in the cache (aborted fetches properly rescheduled)
    // // - able to preempt low priority fetches
    // // - urgent fetches not preempted/aborted
    // // - after full update, cached asset count equal to total asset count
    // // - updated asset in manifest triggers a refetch when old asset version existed
  });
});

// create a test client app with:
// - ClientAppAssetService
// - GameServer
//   - uses ClientAppAssetService for game calculations
// - TestGameClient
//
// GameServerNode
// - GameServerNodeAssetService
// - contains AssetServer which uses the GameServerNodeAssetService
// - contains a GameServer which also uses the GameServerNodeAssetService
//
// AssetServer
// - GET -> AssetManifest
// - GET -> Asset by AssetId
// - GameServerNodeAssetService
// - GameServer
//   - uses GameServerNodeAssetService for game calculations
