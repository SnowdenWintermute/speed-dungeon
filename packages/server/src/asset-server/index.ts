import { AssetId, AssetService, invariant } from "@speed-dungeon/common";
import { AssetCache } from "@speed-dungeon/common";
import { Router, Request, Response, NextFunction } from "express";

export class GameServerNodeAssetService implements AssetService {
  constructor(private localFileSystemStore: AssetCache) {}
  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    const versionedAsset = await this.localFileSystemStore.getAsset(assetId);
    return versionedAsset.bytes;
  }
}

export class AssetServer {
  constructor(private readonly assetService: AssetService) {}

  createRouter(): Router {
    const router = Router();

    router.get("/assets/manifest", this.serveManifest.bind(this));
    router.get("/assets/:assetId", this.serveAsset.bind(this));

    return router;
  }

  private serveManifest(req: Request, res: Response, next: NextFunction) {
    const manifest = new Map();
    res.json(manifest);
  }

  private async serveAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const assetId = req.params.assetId;
      invariant(assetId !== undefined, "No assetId provided");
      const asset = await this.assetService.getAsset(assetId as AssetId);

      const buffer = Buffer.from(asset);
      res
        .status(200)
        .setHeader("Content-Type", "application/octet-stream")
        .setHeader("Content-Length", buffer.byteLength.toString())
        .send(buffer);
    } catch (err) {
      next(err);
    }
  }
}
