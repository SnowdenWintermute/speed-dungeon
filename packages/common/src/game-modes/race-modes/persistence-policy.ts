import { GameModePersistencePolicy } from "../persistence-policy.js";

export class RaceModesPersistencePolicy extends GameModePersistencePolicy {
  async onGameStart(): Promise<void> {
    return;
  }

  async onBattleResult(): Promise<void> {
    return;
  }

  async onFloorDescent(): Promise<void> {
    return;
  }
}
