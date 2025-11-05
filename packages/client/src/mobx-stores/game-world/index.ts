import { EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { BabylonControlledCombatantData } from "./babylon-controlled-ui";

export class GameWorldStore {
  private modelLoadingStates: Record<EntityId, boolean> = {};
  private babylonControlledCombatantDOMData: Record<EntityId, BabylonControlledCombatantData> = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setModelLoading(entityId: EntityId) {
    this.modelLoadingStates[entityId] = true;
  }

  setModelIsLoaded(entityId: EntityId) {
    this.modelLoadingStates[entityId] = false;
  }

  clearModelLoadingState(entityId: EntityId) {
    delete this.modelLoadingStates[entityId];
  }

  modelIsLoading(entityId: EntityId) {
    const modelIsLoading = this.modelLoadingStates[entityId];
    if (modelIsLoading === undefined) return true;
    return this.modelLoadingStates[entityId];
  }

  getCombatantDebugDisplay(entityId: EntityId) {
    const combatantDataOption = this.babylonControlledCombatantDOMData[entityId];
    if (combatantDataOption === undefined) return "";
    return combatantDataOption.debugHtml;
  }
}
