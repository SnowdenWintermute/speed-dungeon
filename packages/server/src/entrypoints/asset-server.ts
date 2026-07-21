import { AssetServer } from "@speed-dungeon/common";
import cors from "cors";
import express from "express";
import { AssetServerRouter } from "../asset-server/index.js";
import expressErrorHandler from "../express-error-handler/index.js";
import { NodeFileSystemAssetStore } from "../services/assets/stores/node-file-system.js";
import { assetServerEnv } from "../validate-asset-server-env.js";

const fsAssetStore = new NodeFileSystemAssetStore(assetServerEnv.ASSETS_DIRECTORY);
const assetServer = new AssetServer(fsAssetStore);
await assetServer.initialize();

const expressApp = express();
expressApp.use(cors({ origin: assetServerEnv.FRONT_END_URL, credentials: true }));

new AssetServerRouter(assetServer, fsAssetStore).attachRouter(expressApp, {
  isProduction: assetServerEnv.isProduction,
});

expressApp.use(expressErrorHandler);

expressApp.listen(assetServerEnv.ASSET_SERVER_PORT, () => {
  console.info(`asset server on port ${assetServerEnv.ASSET_SERVER_PORT}`);
});
