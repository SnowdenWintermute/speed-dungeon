import {
  ClientAppAssetService,
  Item,
  ItemThumbnailKey,
  getItemThumbnailKeyOption,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { ImageString, ItemThumbnailCache } from "./item-thumbnail-cache";
import { ItemThumbnailRenderer, ItemThumbnailRendererFactory } from "./item-thumbnail-renderer";

export class ItemThumbnailService {
  private thumbnails = new Map<ItemThumbnailKey, ImageString>();
  private inFlight = new Set<ItemThumbnailKey>();
  // one renderer, one canvas: overlapping renders would resize the canvas and stop each other's
  // render loop mid-screenshot
  private renderChain: Promise<unknown> = Promise.resolve();
  private rendererOption: null | Promise<ItemThumbnailRenderer> = null;
  private freshCacheOption: null | Promise<void> = null;
  // incremented when clearing. a render that settles afterward sees itself as stale and drops its
  // image instead of writing the appearance the clear was meant to discard back into the cache
  private generation = 0;

  constructor(
    private readonly cache: ItemThumbnailCache,
    private readonly assetService: ClientAppAssetService,
    private readonly createRenderer: ItemThumbnailRendererFactory
  ) {
    makeAutoObservable(this);
  }

  getOption(item: Item) {
    const key = getItemThumbnailKeyOption(item);
    if (key === null) {
      return undefined;
    }
    return this.thumbnails.get(key);
  }

  getAll(): ReadonlyMap<ItemThumbnailKey, ImageString> {
    return this.thumbnails;
  }

  /** Idempotent: items sharing an appearance are rendered once, ever, and every later asker is
   * served from the cache. Safe to call on every render of a component. */
  request(item: Item) {
    const key = getItemThumbnailKeyOption(item);
    if (key === null || this.thumbnails.has(key) || this.inFlight.has(key)) {
      return;
    }

    const generation = this.generation;
    this.inFlight.add(key);
    this.resolveThumbnail(key, item, generation)
      .catch((error) => console.info("item thumbnail failed", key, error))
      .finally(() => {
        // a clear already emptied this, and a newer request may have re-added the key
        if (generation === this.generation) {
          this.inFlight.delete(key);
        }
      });
  }

  async clear() {
    this.generation += 1;
    this.thumbnails.clear();
    this.inFlight.clear();
    await this.cache.clear();
  }

  dispose() {
    this.rendererOption?.then((renderer) => renderer.dispose()).catch(() => {});
    this.cache.dispose();
  }

  private async resolveThumbnail(key: ItemThumbnailKey, item: Item, generation: number) {
    await this.requireFreshCache();

    const cached = await this.cache.getOption(key);
    if (cached !== undefined) {
      if (generation === this.generation) {
        this.thumbnails.set(key, cached);
      }
      return;
    }

    const image = await this.enqueueRender(item);
    if (generation !== this.generation) {
      return;
    }
    this.thumbnails.set(key, image);
    await this.cache.set(key, image);
  }

  private enqueueRender(item: Item) {
    const render = this.renderChain.then(async () => {
      const renderer = await this.requireRenderer();
      return renderer.renderThumbnail(item);
    });
    this.renderChain = render.catch(() => undefined);
    return render;
  }

  private requireRenderer() {
    if (this.rendererOption === null) {
      this.rendererOption = this.createRenderer();
    }
    return this.rendererOption;
  }

  // resolves rather than rejects when the manifest can't be read, so an offline session serves
  // the thumbnails it already has instead of none at all
  private requireFreshCache() {
    if (this.freshCacheOption === null) {
      this.freshCacheOption = this.assetService
        .waitUntilReady()
        .then(() => this.cache.discardIfStale(this.assetService.getManifestFingerprint()))
        .catch(() => undefined);
    }
    return this.freshCacheOption;
  }
}
