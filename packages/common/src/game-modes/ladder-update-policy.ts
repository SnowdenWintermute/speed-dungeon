import { AdventuringParty } from "../adventuring-party/index.js";
import { EntityId, Milliseconds } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { PartyDelayedGameMessageFactory } from "../servers/game-server/party-delayed-game-message-factory.js";
import { CrossServerBroadcasterService } from "../servers/services/cross-server-broadcaster/index.js";
import { CharacterLevelLadderService } from "../servers/services/ranked-ladder.js";
import { ServerCommand } from "../servers/services/server-command/index.js";
import { UserSessionRegistry } from "../servers/sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../servers/update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../servers/update-delivery/outbox.js";
import { IdGenerator } from "../utility-classes/index.js";
import { LadderGameRecordsService } from "./ladder-records/ladder-records-service.js";

/** how to update which ladder when certain events happen
 * will need access to ladder services, or be owned by a composing class that
 * can pass the services to each method
 * */
export abstract class GameModeLadderUpdatePolicy {
  constructor(
    protected userSessionRegistry: UserSessionRegistry,
    protected characterLevelLadderService: CharacterLevelLadderService,
    protected gameRecordsLadderService: LadderGameRecordsService,
    protected updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    protected partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory,
    protected crossServerBroadcasterService: CrossServerBroadcasterService<
      GameStateUpdate,
      ServerCommand
    >,
    protected idGenerator: IdGenerator
  ) {}

  async onFloorDescent(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    clearedFloor: number,
    timeSpentOnFloorMs: Milliseconds
  ): Promise<void> {}
  async onGameStart(game: SpeedDungeonGame): Promise<void> {}
  async onLiveGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    return new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
  }
  async onLastPlayerLeftLiveGame(game: SpeedDungeonGame): Promise<void> {}
  async onPartyEscape(game: SpeedDungeonGame): Promise<void> {}
  async onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    return undefined;
  }
  async onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    return undefined;
  }
}
