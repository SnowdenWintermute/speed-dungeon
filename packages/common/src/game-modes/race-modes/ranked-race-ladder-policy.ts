import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId, Milliseconds } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

export class RankedRaceModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override async onGameStart(game: SpeedDungeonGame): Promise<void> {
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.recordNewGame(game, usernamesToUserIds);
  }

  override async onFloorDescent(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    clearedFloor: number,
    timeSpentOnFloorMs: Milliseconds
  ): Promise<void> {
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
    await this.gameRecordsLadderService.recordPartyFloorClear(
      party,
      clearedFloor,
      timeSpentOnFloorMs,
      game.characterControlScheme
    );
  }

  override async onPartyEscape(game: SpeedDungeonGame): Promise<void> {
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
  }

  override async onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
    // the leave-induced wipe path removes a solo player's party from the live game before this runs,
    // so the aggregate sweep above skips it; persist this party's fate directly so a loss can't be lost.
    const fate = party.fate;
    if (fate !== null) {
      await this.gameRecordsLadderService.updatePartyFate({
        partyRecordId: party.id,
        fate,
        deepestFloorReached: party.dungeonExplorationManager.getCurrentFloor(),
      });
    }
    return undefined;
  }

  override async onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
    return undefined;
  }
}
