import { Item } from "@speed-dungeon/common";
import { ImageString } from "./item-thumbnail-cache";

/** Takes the picture. Implemented in game-world-view, which owns babylon, and reached only on a
 * cache miss so pages that never miss don't pay for a renderer. */
export interface ItemThumbnailRenderer {
  renderThumbnail(item: Item): Promise<ImageString>;
  dispose(): void;
}

export type ItemThumbnailRendererFactory = () => Promise<ItemThumbnailRenderer>;
