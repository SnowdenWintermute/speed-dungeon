import { EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export type ImageString = string;

export class ImagesStore {
  private itemThumbnails: Map<EntityId, ImageString> = new Map();
  private combatantPortraits: Map<EntityId, ImageString> = new Map();

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
}
