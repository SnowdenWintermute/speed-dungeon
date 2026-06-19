import { AdventuringParty } from "../../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import {
  GameClosedReason,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../packets/game-state-updates.js";
import { GameServerGameLifecycleController } from "../../servers/game-server/controllers/game-lifecycle/index.js";
import { UserIdType } from "../../servers/sessions/user-ids.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { ArrayUtils } from "../../utils/array-utils.js";
import { invariant } from "../../utils/index.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class IronmanModePersistencePolicy extends GameModePersistencePolicy {
  override async onGameStart(game: SpeedDungeonGame): Promise<void> {
    const userIdsToUsernames = game.getAuthUserIdsToUsernames(
      this.userSessionRegistry.getAllSessionsInGame(game)
    );
    await this.userGameDataPersistenceService.saveIronmanRun(game, userIdsToUsernames);
  }

  override async onBattleResult(): Promise<void> {
    return;
  }

  override async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    game.clock.updateAccumulatedPlayTime();
    const userIdsToUsernames = game.getAuthUserIdsToUsernames(
      this.userSessionRegistry.getAllSessionsInGame(game)
    );
    await this.userGameDataPersistenceService.saveIronmanRun(game, userIdsToUsernames);
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
    if (defaultParty.fate === null) {
      game.clock.endLiveSession();
      const userIdsToUsernames = game.getAuthUserIdsToUsernames(
        this.userSessionRegistry.getAllSessionsInGame(game)
      );
      await this.userGameDataPersistenceService.saveIronmanRun(game, userIdsToUsernames);
    }

    // close the game
    await gameLifecycleController.cleanUpGame(game);

    return outbox;
  }

  override async onLastPlayerLeftLiveGame(): Promise<void> {
    return;
  }

  override async onPartyEscape(game: SpeedDungeonGame): Promise<void> {
    await this.cleanUpRun(game);
  }

  override async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.cleanUpRun(game);
  }

  private async cleanUpRun(game: SpeedDungeonGame) {
    // delete the run from persistence
    await this.userGameDataPersistenceService.deleteIronmanRun(game.id);
    // delete the run id from the participating user's profiles
    for (const user of this.userSessionRegistry.getAllSessionsInGame(game)) {
      invariant(
        user.taggedUserId.type === UserIdType.Auth,
        ERROR_MESSAGES.SERVER.EXPECTED_AUTH_USER
      );
      const profile = await this.profileService.fetchExpectedProfile(user.taggedUserId.id);
      ArrayUtils.removeElement(profile.ironmanRunIds, game.id);
      await this.profileService.update(user.taggedUserId.id, profile);
    }
  }

  override async onPartyBattleVictory(): Promise<void> {
    return;
  }
}
