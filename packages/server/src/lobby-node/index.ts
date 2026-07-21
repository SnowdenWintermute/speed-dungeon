import {
  LobbyServer,
  LobbyExternalServices,
  IdentityProviderService,
  ConnectionIdentityResolutionContext,
  CrossServerBroadcasterService,
  GameStateUpdate,
  ServerCommand,
  GameSessionStoreService,
  RandomNumberGenerationPolicyFactory,
  cookieHeaderAuthSessionIdParser,
  IdGeneratorRandom,
  UserGlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  UserGameDataPersistenceService,
  SpeedDungeonProfileService,
  LadderGameRecordsService,
  IdGenerator,
  DefaultCharacterCreationPolicy,
  GameServerRegistry,
  LeastBusyGameServerSelector,
} from "@speed-dungeon/common";
import { WebSocketServer } from "ws";
import { playerCharactersRepo } from "../database/repos/player-characters.js";
import { savedIronmanRunsRepo } from "../database/repos/saved-ironman-runs.js";
import { DatabaseCharacterLevelLadderService } from "../game-node/services/ranked-ladder.js";
import {
  DatabaseIronmanRunPersistenceStrategy,
  DatabaseSavedCharacterPersistenceStrategy,
} from "../game-node/services/user-game-data-persistence.js";
import { valkeyManager } from "../kv-store/index.js";
import { NodeWebSocketIncomingConnectionGateway } from "../servers/node-websocket-incoming-connection-gateway.js";
import { Server, IncomingMessage, ServerResponse } from "http";
import { getLoggedInUserOption } from "../game-node/get-logged-in-user-option.js";
import { GAME_SERVER_NAME } from "../main.js";
import { GuestSessionReconnectionToken } from "@speed-dungeon/common";
import { DatabaseLadderRecordsPersistenceStrategy } from "../game-node/services/database-ladder-records-persistence-strategy.js";
import {
  MANUAL_TEST_MODE,
  setLobbyServerNodeManualTestProperties,
} from "../manual-test-mode-config.js";

export class LobbyServerNode {
  private _lobbyServer: LobbyServer | null = null;

  async createServer(
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    gameSessionStoreService: GameSessionStoreService,
    gameServerRegistry: GameServerRegistry,
    globalGameSessionStore: UserGlobalGameSessionStore,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
    profileService: SpeedDungeonProfileService
  ) {
    const wss = new WebSocketServer({ server: httpServer });

    const usersIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(wss);
    const idGenerator = new IdGeneratorRandom({ saveHistory: false });
    const externalServices = this.createExternalServices(
      gameSessionStoreService,
      crossServerBroadcasterService,
      globalGameSessionStore,
      profileService,
      idGenerator
    );
    const leastBusyGameServerSelector = new LeastBusyGameServerSelector(
      gameServerRegistry,
      gameSessionStoreService
    );
    const leastBusyGameServerUrlGetter = () => leastBusyGameServerSelector.select();

    // TO MATCH TEST SETUP

    if (MANUAL_TEST_MODE) {
      this._lobbyServer = setLobbyServerNodeManualTestProperties(
        usersIncomingConnectionGateway,
        externalServices,
        gameServerSessionClaimTokenCodec,
        guestReconnectionTokenCodec,
        leastBusyGameServerUrlGetter,
        cookieHeaderAuthSessionIdParser
      );
    } else {
      this._lobbyServer = new LobbyServer(
        usersIncomingConnectionGateway,
        externalServices,
        gameServerSessionClaimTokenCodec,
        guestReconnectionTokenCodec,
        { [GAME_SERVER_NAME]: "http://localhost:8090" },
        leastBusyGameServerUrlGetter,
        DefaultCharacterCreationPolicy,
        RandomNumberGenerationPolicyFactory.allRandomPolicy(),
        idGenerator,
        cookieHeaderAuthSessionIdParser
      );
    }

    console.info("lobby server node created");
  }

  private createExternalServices(
    gameSessionStoreService: GameSessionStoreService,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    globalGameSessionStore: UserGlobalGameSessionStore,
    profileService: SpeedDungeonProfileService,
    idGenerator: IdGenerator
  ): LobbyExternalServices {
    const identityProviderService = new IdentityProviderService({
      execute: async (context: ConnectionIdentityResolutionContext) => {
        return await getLoggedInUserOption(context.authSessionId, profileService);
      },
    });

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

    const externalServices: LobbyExternalServices = {
      identityProviderService,
      profileService,
      userGameDataPersistenceService,
      characterLevelLadderService,
      ladderGameRecordsService,
      gameSessionStoreService,
      crossServerBroadcasterService,
      globalGameSessionStore,
    };

    return externalServices;
  }
}
