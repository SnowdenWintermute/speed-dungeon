import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId, IdentityProviderId, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { UserIdType } from "../../servers/sessions/user-ids.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { invariant } from "../../utils/index.js";
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
  override async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    // update all game, party and character records
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);

    // create party and character timeToClearFloor records
  }
  override async onPartyEscape(): Promise<void> {
    // update all game, party and character records
    // mark the party record's partyFate/timeOfFate
    // create party and character timeToClearFloor records
  }
  override async onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    // update all game, party and character records
    // mark the party record's partyFate/timeOfFate
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
