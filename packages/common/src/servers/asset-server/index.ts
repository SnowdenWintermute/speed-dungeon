import sodium from "libsodium-wrappers";
import { SKELETON_FILE_PATHS } from "../../assets/skeleton-file-paths.js";
import { invariant, iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { AssetAnalyzer } from "./asset-analyzer/index.js";
import { LocalStoreAssetService } from "../services/assets/local-store-asset-service.js";
import { AssetId } from "../services/assets/index.js";
import {
  GameplayAssetFactsSource,
  VersionedGameplayAssetFacts,
} from "../services/assets/gameplay-asset-facts.js";
import { AssetCache } from "../services/assets/stores/index.js";
import { AssetManifest } from "../services/assets/versioned-asset.js";

export class AssetServer implements GameplayAssetFactsSource {
  private readonly analyzer: AssetAnalyzer;
  private factsOption: null | VersionedGameplayAssetFacts = null;

  constructor(private readonly localStore: AssetCache) {
    this.analyzer = new AssetAnalyzer(new LocalStoreAssetService(localStore));
  }

  async initialize() {
    await this.analyzer.collectAnimationLengths();
    await this.analyzer.collectBoundingBoxSizes();

    this.factsOption = {
      facts: this.analyzer.getFacts(),
      version: await this.computeFactsVersion(),
    };
  }

  async getAssetManifest(): Promise<AssetManifest> {
    const assetIds = await this.localStore.getAssetIdsCached();
    const manifest: AssetManifest = new Map();

    for (const id of assetIds) {
      const asset = await this.localStore.getAsset(id);
      manifest.set(id, asset.versionData);
    }

    return manifest;
  }

  async getGameplayAssetFacts(): Promise<VersionedGameplayAssetFacts> {
    invariant(this.factsOption !== null, "asset server was not initialized before serving facts");
    return this.factsOption;
  }

  private async computeFactsVersion() {
    await sodium.ready;

    const sourceHashes: string[] = [];
    for (const [, skeletonPath] of iterateNumericEnumKeyedRecord(SKELETON_FILE_PATHS)) {
      const asset = await this.localStore.getAssetOption(skeletonPath as AssetId);
      sourceHashes.push(`${skeletonPath}:${asset?.versionData.hash ?? "missing"}`);
    }

    sourceHashes.sort();

    return sodium.to_base64(
      sodium.crypto_generichash(16, sourceHashes.join("|")),
      sodium.base64_variants.ORIGINAL
    );
  }
}
