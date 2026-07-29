import { EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export type ImageString = string;

export class ImageStore {
  private combatantPortraits = new Map<EntityId, ImageString>();

  constructor() {
    makeAutoObservable(this);
  }

  setCombatantPortrait(entityId: EntityId, imageString: ImageString) {
    this.combatantPortraits.set(entityId, imageString);
  }

  getCombatantPortraitOption(entityId: EntityId) {
    return this.combatantPortraits.get(entityId);
  }

  clearCombatantPortrait(entityId: EntityId) {
    this.combatantPortraits.delete(entityId);
  }
}
