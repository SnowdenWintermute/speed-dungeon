import { AssetId, ClientAppAssetService, GameServerNodeAssetService } from "../index.js";
import { RemoteServerAssetStore } from "../stores/remote-server.js";
import { IndexedDbAssetStore } from "../stores/indexed-db.js";
import { indexedDB as fakeIndexedDB } from "fake-indexeddb";
import { NodeFileSystemAssetStore } from "../stores/node-file-system.js";

//
describe("asset management", () => {
  it("something", async () => {
    const testServerUrl = "http://localhost";
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

    const assetId = "monsters/manta-ray-full.glb" as AssetId;
    const asset = await gameServerNodeAssetService.getAsset(assetId);
    console.log(asset);
  });
});

// create a test client app with:
// - ClientAppAssetService
// - GameServer
//   - uses ClientAppAssetService for game calculations
// - TestGameClient
//
// GameServerNode
// - GET -> AssetManifest
// - GET -> Asset by AssetId
// - GameServerNodeAssetService
// - GameServer
//   - uses GameServerNodeAssetService for game calculations
