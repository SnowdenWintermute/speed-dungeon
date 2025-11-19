import { GameWorld } from "@/app/3d-world/game-world";
import { TargetIndicator } from "@/app/target-indicators";
import { CombatActionName, EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class TargetIndicatorStore {
  private indicators: TargetIndicator[] = [];
  _gameWorld: GameWorld | null = null; // we'd like it to be private but then we can't mark it as "not observable"
  constructor() {
    makeAutoObservable(this, { _gameWorld: false });
  }

  /** avoid a circular reference since targetIndicatorStore will need to access GameWorld
  but GameWorld also accesses AppStore.get() which targetIndicatorStore is a member of
  so we can't directly call getGameWorld() inside it */
  initialize(gameWorld: GameWorld) {
    this._gameWorld = gameWorld;
  }

  getIndicatorsTargetingCombatant(entityId: EntityId) {
    return this.indicators.filter((indicator) => indicator.targetId === entityId);
  }

  userHasTargets(entityId: EntityId) {
    const userIndicators = this.indicators.filter((indicator) => indicator.targetedBy === entityId);
    return userIndicators.length > 0;
  }

  clear() {
    this.indicators.length = 0;
  }

  clearUserTargets(actionUserId: EntityId) {
    this.synchronize(null, actionUserId, []);
  }

  synchronize(
    actionNameOption: CombatActionName | null,
    actionUserId: EntityId,
    targetIds: EntityId[]
  ) {
    const newIndicators = [];
    if (actionNameOption === null) {
      // don't remove indicators from other combatants who may also be targeting something
      const newIndicators = this.indicators.filter((item) => item.targetedBy !== actionUserId);
      this.clear();
      this.indicators.push(...newIndicators);
    } else {
      for (const indicator of this.indicators) {
        if (actionNameOption === null && indicator.targetedBy === actionUserId) continue;
        if (indicator.targetedBy === actionUserId) continue;
        newIndicators.push(indicator);
      }
      for (const id of targetIds) {
        newIndicators.push(new TargetIndicator(actionUserId, id, actionNameOption));
      }
      this.clear();
      this.indicators.push(...newIndicators);
    }

    if (this._gameWorld === null) {
      return console.error(
        "Expected targetIndicatorStore to be initialized with gameWorld reference"
      );
    }

    for (const combatantModel of Object.values(this._gameWorld.modelManager.combatantModels)) {
      const targetingThisModel = newIndicators.filter(
        (item) => item.targetId === combatantModel.entityId
      );
      combatantModel.targetingIndicatorBillboardManager.synchronizeIndicators(targetingThisModel);
    }
  }
}
