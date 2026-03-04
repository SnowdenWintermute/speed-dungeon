import { EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { BabylonControlledCombatantData } from "./babylon-controlled-ui";

export class GameWorldStore {
  private modelLoadingStates = new Map<EntityId, boolean>();
  private babylonControlledCombatantDOMData = new Map<EntityId, BabylonControlledCombatantData>();

  constructor() {
    makeAutoObservable(this);
  }

  setModelLoading(entityId: EntityId) {
    this.modelLoadingStates.set(entityId, true);
  }

  setModelIsLoaded(entityId: EntityId) {
    this.modelLoadingStates.set(entityId, false);
  }

  clearModelLoadingState(entityId: EntityId) {
    this.modelLoadingStates.delete(entityId);
  }

  modelIsLoading(entityId: EntityId) {
    const modelIsLoading = this.modelLoadingStates.get(entityId);
    if (modelIsLoading === undefined) return true;
    return this.modelLoadingStates.get(entityId);
  }

  getCombatantDebugDisplay(entityId: EntityId) {
    const combatantDataOption = this.babylonControlledCombatantDOMData.get(entityId);
    if (combatantDataOption === undefined) return "";
    return combatantDataOption.debugHtml;
  }
}
