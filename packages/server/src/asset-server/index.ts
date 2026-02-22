import { AssetId, invariant, NodeFileSystemAssetStore } from "@speed-dungeon/common";
import { AssetManifest } from "@speed-dungeon/common";
import { Express, Router, Request, Response, NextFunction } from "express";

export class AssetServer {
  constructor(private localFileSystemStore: NodeFileSystemAssetStore) {}

  attachRouter(expressApp: Express) {
    const router = Router();

    router.get("/asset-manifest", this.serveManifest.bind(this));
    router.get("/assets/*", this.serveAsset.bind(this));

    expressApp.use(router);
  }

  async createManifest() {
    const assetIds = await this.localFileSystemStore.getAssetIdsCached();

    const manifest: AssetManifest = {};

    for (const id of assetIds) {
      const asset = await this.localFileSystemStore.getAsset(id);
      manifest[id] = asset.versionData;
    }

    return manifest;
  }

  private async serveManifest(req: Request, res: Response, next: NextFunction) {
    const manifest = await this.createManifest();
    res.json(manifest);
  }

  private async serveAsset(req: Request, res: Response, next: NextFunction) {
    try {
      // const assetId = req.params.assetId;
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
