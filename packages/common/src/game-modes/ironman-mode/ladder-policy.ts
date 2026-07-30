import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId, Milliseconds } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";
import { MapUtils } from "../../utils/map-utils.js";

export class IronmanModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override async onGameStart(game: SpeedDungeonGame): Promise<void> {
    if (game.isContinuedRun) {
      return;
    }
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.recordNewGame(game, usernamesToUserIds);
  }

  // the last player leaving is the one sync that cannot read the session registry: their session is
  // going away with them, so the names come from what was persisted instead
  override async onLastPlayerLeftLiveGame(game: SpeedDungeonGame): Promise<void> {
    if (game.requireSingleParty().fate !== null) {
      // in this case we cleaned up the game already
      return;
    }

    const updatedUserIdsToUsernames = await game.getUpdatedUserIdsToUsernamesMap(
      this.userGameDataPersistenceService,
      this.userSessionRegistry
    );

    await this.gameRecordsLadderService.updateGameRecordAggregate(
      game,
      MapUtils.invert(updatedUserIdsToUsernames)
    );
  }

  override async onFloorDescent(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    clearedFloor: number,
    timeSpentOnFloorMs: Milliseconds
  ): Promise<void> {
    await this.syncGameRecords(game);
    await this.gameRecordsLadderService.recordPartyFloorClear(
      party,
      clearedFloor,
      timeSpentOnFloorMs,
      game.characterControlScheme
    );
  }

  override async onPartyEscape(game: SpeedDungeonGame): Promise<void> {
    await this.syncGameRecords(game);
  }

  override async onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    await this.syncGameRecords(game);
    return undefined;
  }

  override async onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    await this.syncGameRecords(game);
    return undefined;
  }
}
