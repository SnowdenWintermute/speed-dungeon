import {
  CrossServerBroadcasterService,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameplayAssetFactsSource,
  GameSessionStoreService,
  GameStateUpdate,
  RandomNumberGenerationPolicyFactory,
  ServerCommand,
  cookieHeaderAuthSessionIdParser,
  IdGeneratorRandom,
  UserGlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  UserGameDataPersistenceService,
  GuestSessionReconnectionToken,
  SpeedDungeonProfileService,
  LadderGameRecordsService,
  IdGenerator,
  RealResourceChangePropertiesStrategy,
  RandomDungeonGenerationPolicy,
} from "@speed-dungeon/common";
import { Server, IncomingMessage, ServerResponse } from "http";
import { WebSocketServer } from "ws";
import { NodeWebSocketIncomingConnectionGateway } from "../servers/node-websocket-incoming-connection-gateway.js";
import {
  DatabaseIronmanRunPersistenceStrategy,
  DatabaseSavedCharacterPersistenceStrategy,
} from "./services/user-game-data-persistence.js";
import { DatabaseCharacterLevelLadderService } from "./services/ranked-ladder.js";
import { valkeyManager } from "../kv-store/index.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";
import { savedIronmanRunsRepo } from "../database/repos/saved-ironman-runs.js";
import { DatabaseLadderRecordsPersistenceStrategy } from "./services/database-ladder-records-persistence-strategy.js";
import {
  MANUAL_TEST_MODE,
  setGameServerNodeManualTestProperties,
} from "../manual-test-mode-config.js";

export class GameServerNode {
  private _server: GameServer | null = null;

  async createServer(
    name: GameServerName,
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    profileService: SpeedDungeonProfileService,
    gameSessionStoreService: GameSessionStoreService,
    globalGameSessionStore: UserGlobalGameSessionStore,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
    gameplayAssetFactsSource: GameplayAssetFactsSource
  ) {
    const { facts } = await gameplayAssetFactsSource.getGameplayAssetFacts();

    const wss = new WebSocketServer({ server: httpServer });
    const incomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(wss);
    const idGenerator = new IdGeneratorRandom({ saveHistory: false });
    const externalServices = this.createExternalServices(
      gameSessionStoreService,
      crossServerBroadcasterService,
      globalGameSessionStore,
      profileService,
      idGenerator
    );

    // TO MATCH TESTS
    if (MANUAL_TEST_MODE) {
      this._server = setGameServerNodeManualTestProperties(
        name,
        gameServerSessionClaimTokenCodec,
        guestReconnectionTokenCodec,
        incomingConnectionGateway,
        externalServices,
        facts,
        cookieHeaderAuthSessionIdParser
      );
    } else {
      const rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
      this._server = new GameServer(
        name,
        incomingConnectionGateway,
        externalServices,
        gameServerSessionClaimTokenCodec,
        guestReconnectionTokenCodec,
        facts,
        RandomDungeonGenerationPolicy,
        rngPolicy,
        new RealResourceChangePropertiesStrategy(),
        idGenerator,
        cookieHeaderAuthSessionIdParser
      );
    }
  }

  private createExternalServices(
    gameSessionStoreService: GameSessionStoreService,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    globalGameSessionStore: UserGlobalGameSessionStore,
    profileService: SpeedDungeonProfileService,
    idGenerator: IdGenerator
  ): GameServerExternalServices {
    const savedCharactersPersistenceStrategy = new DatabaseSavedCharacterPersistenceStrategy(
      playerCharactersRepo
    );
    const ironmanRunPersistenceStrategy = new DatabaseIronmanRunPersistenceStrategy(
      savedIronmanRunsRepo
    );
    const userGameDataPersistenceService = new UserGameDataPersistenceService(
      savedCharactersPersistenceStrategy,
      ironmanRunPersistenceStrategy,
      profileService
    );

    const characterLevelLadderService = new DatabaseCharacterLevelLadderService(
      valkeyManager.context
    );

    const ladderGameRecordsService = new LadderGameRecordsService(
      new DatabaseLadderRecordsPersistenceStrategy(),
      idGenerator
    );

    const result: GameServerExternalServices = {
      gameSessionStoreService,
      userGameDataPersistenceService,
      characterLevelLadderService,
      ladderGameRecordsService,
      crossServerBroadcasterService,
      globalGameSessionStore,
      profileService,
    };
    return result;
  }
}
