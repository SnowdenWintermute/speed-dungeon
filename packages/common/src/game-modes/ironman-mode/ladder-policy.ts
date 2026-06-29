import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId, Milliseconds } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

export class IronmanModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override async onGameStart(game: SpeedDungeonGame): Promise<void> {
    if (game.isContinuedRun) {
      return;
    }
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.recordNewGame(game, usernamesToUserIds);
  }

  override async onLastPlayerLeftLiveGame(game: SpeedDungeonGame): Promise<void> {
    // update all game, party and character records
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
  }

  override async onFloorDescent(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    clearedFloor: number,
    timeSpentOnFloorMs: Milliseconds
  ): Promise<void> {
    // update all game, party and character records
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);

    // create party and character timeToClearFloor records using clearedFloor + timeSpentOnFloorMs
    await this.gameRecordsLadderService.recordPartyFloorClear(
      party,
      clearedFloor,
      timeSpentOnFloorMs
    );
  }

  override async onPartyEscape(game: SpeedDungeonGame): Promise<void> {
    // update all game, party and character records
    // mark the party record's partyFate/timeOfFate
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
    // create party and character timeToClearFloor records
  }

  override async onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    // update all game, party and character records
    // mark the party record's partyFate/timeOfFate
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
    return undefined;
  }

  override async onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    // update all game, party and character records
    return undefined;
  }
}
