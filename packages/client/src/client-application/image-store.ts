import { CONSUMABLE_TYPE_STRINGS, Consumable, EntityId, Item } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export type ImageString = string;

export class ImageStore {
  private itemThumbnails = new Map<EntityId, ImageString>();
  private combatantPortraits = new Map<EntityId, ImageString>();

  constructor() {
    makeAutoObservable(this);
  }

  setItemThumbnail(entityId: EntityId, imageString: ImageString) {
    this.itemThumbnails.set(entityId, imageString);
  }

  getItemThumbnails(): ReadonlyMap<EntityId, ImageString> {
    return this.itemThumbnails;
  }

  getItemThumbnailOption(entityId: EntityId) {
    return this.itemThumbnails.get(entityId);
  }

  clearThumbnailIds(ids: EntityId[]) {
    for (const id of ids) {
      this.itemThumbnails.delete(id);
    }
  }

  clearAllThumbnails() {
    this.itemThumbnails.clear();
  }

  setCombatantPortrait(entityId: EntityId, imageString: ImageString) {
    this.combatantPortraits.set(entityId, imageString);
  }

  getCombatantPortraitOption(entityId: EntityId) {
    return this.combatantPortraits.get(entityId);
  }

  getItemButtonThumbnail(item: Item) {
    let thumbnailId = item.entityProperties.id;
    if (item instanceof Consumable) {
      thumbnailId = CONSUMABLE_TYPE_STRINGS[item.consumableType];
    }
    return this.getItemThumbnailOption(thumbnailId);
  }
}
