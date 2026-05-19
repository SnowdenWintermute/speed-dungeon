import { GameModePersistencePolicy } from "../persistence-policy.js";

export class RaceModesPersistencePolicy implements GameModePersistencePolicy {
  async onGameStart(): Promise<void> {
    return;
  }

  async onBattleResult(): Promise<void> {
    return;
  }

  async onFloorDescent(): Promise<void> {
    return;
  }

  async onLiveGameLeave() {
    return;
  }

  async onLastPlayerLeftLiveGame(): Promise<void> {
    return;
  }

  async onPartyEscape(): Promise<void> {
    return;
  }

  async onPartyWipe(): Promise<void> {
    return;
  }

  async onPartyBattleVictory(): Promise<void> {
    return;
  }
}
