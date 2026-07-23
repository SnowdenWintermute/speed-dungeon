import { AssetId, AssetServer, invariant, MapUtils } from "@speed-dungeon/common";
import { Express, Router, Request, Response, NextFunction } from "express";
import { NodeFileSystemAssetStore } from "../services/assets/stores/node-file-system.js";
import { appRoute } from "../app-route.js";

export class AssetServerRouter {
  constructor(
    private readonly assetServer: AssetServer,
    private readonly localFileSystemStore: NodeFileSystemAssetStore
  ) {}

  attachRouter(expressApp: Express, options: { isProduction: boolean }) {
    const router = Router();

    const { isProduction } = options;
    router.get(appRoute({ isProduction }, "/asset-manifest"), this.serveManifest.bind(this));
    router.get(
      appRoute({ isProduction }, "/gameplay-asset-facts"),
      this.serveGameplayAssetFacts.bind(this)
    );
    router.get(appRoute({ isProduction }, "/assets/*"), this.serveAsset.bind(this));

    expressApp.use(router);
  }

  private async serveManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const manifest = await this.assetServer.getAssetManifest();
      res.json(MapUtils.serialize(manifest));
    } catch (err) {
      console.error("error serving asset manifest:", err);
      next(err);
    }
  }

  private async serveGameplayAssetFacts(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await this.assetServer.getGameplayAssetFacts());
    } catch (err) {
      console.error("error serving gameplay asset facts:", err);
      next(err);
    }
  }

  private async serveAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const assetId = req.params[0];
      invariant(assetId !== undefined, "No assetId provided");
      const asset = await this.localFileSystemStore.getAsset(assetId as AssetId);

      const buffer = Buffer.from(asset.bytes);

      res
        .status(200)
        .setHeader("Content-Type", "application/octet-stream")
        .setHeader("Content-Length", buffer.byteLength.toString())
        .send(buffer);
    } catch (err) {
      console.error("error serving asset:", err);
      next(err);
    }
  }
}
