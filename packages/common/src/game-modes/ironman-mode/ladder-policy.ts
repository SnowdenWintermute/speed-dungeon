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

    const sessionsInGame = this.userSessionRegistry.getAllSessionsInGame(game);
    const userIdsInGame = sessionsInGame.map((session) => {
      invariant(session.taggedUserId.type === UserIdType.Auth, "expected auth users only");
      return session.taggedUserId.id;
    });

    await this.gameRecordsLadderService.recordNewGame(game, userIdsInGame);
  }
  override async onLastPlayerLeftLiveGame(): Promise<void> {
    // update all game, party and character records
  }
  override async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    // update all game, party and character records
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
