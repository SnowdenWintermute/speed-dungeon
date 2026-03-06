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
  it("asset prefetch", async () => {
    const testServerUrl = `http://localhost:${ASSET_CACHE_TEST_PORT}`;
    const remoteStore = new RemoteServerAssetStore(testServerUrl);
    const cache = new IndexedDbAssetStore(fakeIndexedDB);

    // @TODO - need real asset list
    const assetsByDefaultFetchPriority = new Map();

    const isOnline = () => true;
    const clientAppAssetService = new ClientAppAssetService(
      remoteStore,
      cache,
      assetsByDefaultFetchPriority,
      isOnline
    );

    const baseAssetDirectory = "packages/server/assets/";
    const localFileSystemStore = new NodeFileSystemAssetStore(baseAssetDirectory);

    const gameServerNodeAssetService = new GameServerNodeAssetService(localFileSystemStore);

    const expressApp = createExpressApp();
    const assetServer = new AssetServer(localFileSystemStore);
    assetServer.attachRouter(expressApp, { isProduction: false });

    expressApp.listen(ASSET_CACHE_TEST_PORT, () => {
      console.info("started listening for asset requests");
    });

    await clientAppAssetService.initialize();
    await clientAppAssetService.scheduleAssetUpdates();
    const fullUpdatePromise = clientAppAssetService.startAssetUpdatesPrefetch();

    const firstUrgentAssetId = "monsters/wolf-full.glb";

    clientAppAssetService.getAsset(firstUrgentAssetId as AssetId);

    const urgentAssetIds = [
      "monsters/old/velociraptor-full.glb",
      "monsters/old/velociraptor-main-skeleton (copy 1).glb",
      "monsters/old/velociraptor-main-skeleton.glb",
      "monsters/old/wolf-full.glb",
      "monsters/old/wolf-main-skeleton.glb",
      "monsters/spider-full.glb",
      "monsters/spider-main-skeleton.glb",
      "monsters/wolf-main-skeleton-pre-on-summoned.glb",
      "monsters/wolf-main-skeleton.glb",
    ].map((item) => item as AssetId);

    for (const assetId of urgentAssetIds) {
      clientAppAssetService.getAsset(assetId);
    }

    await fullUpdatePromise;

    // to test:
    // - after full update, able to find an asset that was preempted/aborted in the cache (aborted fetches properly rescheduled)
    // - able to preempt low priority fetches
    // - urgent fetches not preempted/aborted
    // - after full update, cached asset count equal to total asset count
    // - updated asset in manifest triggers a refetch when old asset version existed
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
