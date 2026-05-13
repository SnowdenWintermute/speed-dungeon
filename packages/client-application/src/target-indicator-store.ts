import { GameWorldView } from "@/game-world-view";
import { CombatActionName, EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class TargetIndicator {
  constructor(
    public targetedBy: EntityId,
    public targetId: EntityId,
    public actionName: CombatActionName
  ) {}

  getKey() {
    return this.targetedBy + this.targetId;
  }
}

export class TargetIndicatorStore {
  private indicators: TargetIndicator[] = [];
  _gameWorldView: GameWorldView | null = null; // we'd like it to be private but then we can't mark it as "not observable"
  constructor() {
    makeAutoObservable(this, { _gameWorldView: false });
  }

  initialize(gameWorldView: GameWorldView) {
    this._gameWorldView = gameWorldView;
  }

  getIndicatorsTargetingCombatant(entityId: EntityId) {
    return this.indicators.filter((indicator) => indicator.targetId === entityId);
  }

  userHasTargets(entityId: EntityId) {
    const userIndicators = this.indicators.filter((indicator) => indicator.targetedBy === entityId);
    return userIndicators.length > 0;
  }

  clear() {
    this.indicators = [];

    if (this._gameWorldView === null) {
      return;
    }

    const { combatantSceneEntityManager } = this._gameWorldView.sceneEntityService;
    for (const [_, combatantModel] of combatantSceneEntityManager.sceneEntities) {
      combatantModel.targetingIndicatorManager.synchronizeIndicators([]);
    }
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

    if (this._gameWorldView === null) {
      return;
      // return console.error(
      //   "Expected targetIndicatorStore to be initialized with gameWorld reference"
      // );
    }

    const { combatantSceneEntityManager } = this._gameWorldView.sceneEntityService;
    for (const [_, combatantModel] of combatantSceneEntityManager.sceneEntities) {
      const targetingThisModel = newIndicators.filter(
        (item) => item.targetId === combatantModel.entityId
      );
      combatantModel.targetingIndicatorManager.synchronizeIndicators(targetingThisModel);
    }
  }
}
