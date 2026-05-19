import { ClientSequentialEvent } from "../../packets/client-sequential-events.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

export class UnrankedRaceModeLadderPolicy implements GameModeLadderUpdatePolicy {
  async onFloorDescent(): Promise<void> {
    return;
  }

  async onGameStart(): Promise<void> {
    return;
  }

  async onBattleResult(): Promise<void> {
    return;
  }

  async onLiveGameLeave(): Promise<ClientSequentialEvent[]> {
    return [];
  }

  async onLastPlayerLeftLiveGame(): Promise<void> {
    return;
  }

  async onPartyEscape(): Promise<void> {
    return;
  }

  async onPartyWipe() {
    return undefined;
  }

  async onPartyBattleVictory() {
    return undefined;
  }
}
