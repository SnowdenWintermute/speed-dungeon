import { AssetId, ClientAppAssetService } from "@speed-dungeon/common";
import { IndexedDbAssetStore } from "@speed-dungeon/common";
import { NodeFileSystemAssetStore } from "@speed-dungeon/common";
import { RemoteServerAssetStore } from "@speed-dungeon/common";
import { AssetServer, GameServerNodeAssetService } from "@speed-dungeon/server";
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
    localFileSystemStore.getAssetIdsCached();

    const gameServerNodeAssetService = new GameServerNodeAssetService(localFileSystemStore);

    const expressApp = createExpressApp();
    const assetServer = new AssetServer(localFileSystemStore);
    const assetRouter = assetServer.createRouter();
    expressApp.use(assetRouter);

    expressApp.listen(ASSET_CACHE_TEST_PORT, () => {
      console.log("started listening for asset requests");
    });

    await clientAppAssetService.initialize();
    await clientAppAssetService.startPrefetch();
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
