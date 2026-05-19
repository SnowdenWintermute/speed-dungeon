import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import {
  GameClosedReason,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../packets/game-state-updates.js";
import { GameServerGameLifecycleController } from "../../servers/game-server/controllers/game-lifecycle/index.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class IronmanModePersistencePolicy extends GameModePersistencePolicy {
  override async onGameStart(game: SpeedDungeonGame): Promise<void> {
    await this.userGameDataPersistenceService.saveIronmanRun(
      game,
      this.userSessionRegistry.getAllSessionsInGame(game)
    );
  }

  override async onBattleResult(): Promise<void> {
    return;
  }

  override async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.userGameDataPersistenceService.saveIronmanRun(
      game,
      this.userSessionRegistry.getAllSessionsInGame(game)
    );
  }

  override async onLiveGameLeave(
    game: SpeedDungeonGame,
    player: SpeedDungeonPlayer,
    gameLifecycleController: GameServerGameLifecycleController
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    // tell other players "a teammate disconnected, game closed"
    // if their client tries to do anything in the game, it wont work because it is closed
    // a compliant client should reconnect to the lobby server
    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.GameClosed,
      data: { reason: GameClosedReason.PlayerLeftGame },
    });

    // if the game has not completed in a wipe or escape, save it
    const defaultParty = game.requireSingleParty();
    if (defaultParty.timeOfWipe === null && defaultParty.timeOfEscape === null) {
      await this.userGameDataPersistenceService.saveIronmanRun(
        game,
        this.userSessionRegistry.getAllSessionsInGame(game)
      );
    }

    // close the game
    await gameLifecycleController.cleanUpGame(game);

    return outbox;
  }

  override async onLastPlayerLeftLiveGame(): Promise<void> {
    return;
  }

  override async onPartyEscape(): Promise<void> {
    // delete the run from persistence
    throw new Error("Method not implemented.");
  }

  override async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    // delete the run from persistence
    throw new Error("Method not implemented.");
  }

  override async onPartyBattleVictory(): Promise<void> {
    return;
  }
}
