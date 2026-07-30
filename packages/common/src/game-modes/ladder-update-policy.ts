import { AdventuringParty } from "../adventuring-party/index.js";
import { ChannelName, EntityId, Milliseconds } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { LADDER_UPDATES_CHANNEL_NAME } from "../packets/channels.js";
import { GameMessage, GameMessageType } from "../packets/game-message.js";
import { GameStateUpdate, GameStateUpdateType } from "../packets/game-state-updates.js";
import { PartyDelayedGameMessageFactory } from "../servers/game-server/party-delayed-game-message-factory.js";
import {
  CrossServerBroadcastType,
  CrossServerBroadcasterService,
} from "../servers/services/cross-server-broadcaster/index.js";
import { ExperiencePointsLadderService } from "../servers/services/experience-points-ladder-service.js";
import { ServerCommand } from "../servers/services/server-command/index.js";
import { UserGameDataPersistenceService } from "../servers/services/user-game-data-persistence/index.js";
import { UserSessionRegistry } from "../servers/sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../servers/update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../servers/update-delivery/outbox.js";
import { LadderGameRecordsService } from "../ladder/records/ladder-records-service.js";

// everything a ladder policy is allowed to reach. one object rather than seven parameters because
// all four modes' policies take the same seven, so the set is assembled once and handed over whole
export interface LadderPolicyDependencies {
  userSessionRegistry: UserSessionRegistry;
  experiencePointsLadderService: ExperiencePointsLadderService;
  userGameDataPersistenceService: UserGameDataPersistenceService;
  gameRecordsLadderService: LadderGameRecordsService;
  updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>;
  partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory;
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>;
}

/** how to update which ladder when certain events happen */
export abstract class GameModeLadderUpdatePolicy {
  protected readonly userSessionRegistry: UserSessionRegistry;
  protected readonly experiencePointsLadderService: ExperiencePointsLadderService;
  protected readonly userGameDataPersistenceService: UserGameDataPersistenceService;
  protected readonly gameRecordsLadderService: LadderGameRecordsService;
  protected readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>;
  protected readonly partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory;
  protected readonly crossServerBroadcasterService: CrossServerBroadcasterService<
    GameStateUpdate,
    ServerCommand
  >;

  constructor(dependencies: LadderPolicyDependencies) {
    this.userSessionRegistry = dependencies.userSessionRegistry;
    this.experiencePointsLadderService = dependencies.experiencePointsLadderService;
    this.userGameDataPersistenceService = dependencies.userGameDataPersistenceService;
    this.gameRecordsLadderService = dependencies.gameRecordsLadderService;
    this.updateDispatchFactory = dependencies.updateDispatchFactory;
    this.partyDelayedGameMessageFactory = dependencies.partyDelayedGameMessageFactory;
    this.crossServerBroadcasterService = dependencies.crossServerBroadcasterService;
  }

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

  // the game, party and character records all hold last-known state, so any event that can change one
  // of them refreshes the whole aggregate rather than each event knowing what it touched. only the
  // modes whose runs become ladder records call this — progression games are not ranked, and an
  // unranked race is unranked by definition
  protected async syncGameRecords(game: SpeedDungeonGame): Promise<void> {
    const usernamesToUserIds = this.userSessionRegistry.getGameUsernameToIdsMap(game);
    await this.gameRecordsLadderService.updateGameRecordAggregate(game, usernamesToUserIds);
  }

  // anything the ladder wants everyone to hear about: a death that left the board, a rank climbed, a
  // record time. the party sees it in their own channel and on their own delay, and everyone not in
  // that party — including players on other servers — sees it on the ladder channel
  protected announceLadderEvent(
    outbox: MessageDispatchOutbox<GameStateUpdate>,
    partyChannel: ChannelName,
    messageType: GameMessageType,
    text: string
  ): void {
    outbox.pushFromOther(
      this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
        partyChannel,
        messageType,
        text,
        partyChannel
      )
    );
    this.crossServerBroadcasterService.publish({
      type: CrossServerBroadcastType.ChannelFanOut,
      channelName: LADDER_UPDATES_CHANNEL_NAME,
      payload: {
        type: GameStateUpdateType.GameMessage,
        data: { message: new GameMessage(messageType, false, text) },
      },
      excludedConnectionIds: this.userSessionRegistry.in(partyChannel),
    });
  }
}
