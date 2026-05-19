import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class ProgressionModePersistencePolicy extends GameModePersistencePolicy {
  override onGameStart(): Promise<void> {
    return Promise.resolve();
  }

  override async onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.userGameDataPersistenceService.updateAllInParty(game, party);
  }

  override async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.userGameDataPersistenceService.updateAllInParty(game, party);
  }

  override async onLiveGameLeave(game: SpeedDungeonGame, player: SpeedDungeonPlayer) {
    await this.userGameDataPersistenceService.updateCharactersOwnedByPlayerInGame(game, player);
    return new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
  }
}
