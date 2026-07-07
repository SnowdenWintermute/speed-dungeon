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
  ScriptedCharacterCreationPolicy,
  BASIC_CHARACTER_FIXTURES,
  IdGeneratorSequential,
  CHARARCTER_FIXTURES_WITH_PETS,
  HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS,
  MONSTER_FIXTURES,
  CHARARCTER_FIXTURES_WITH_PET_MANTAS,
  LOW_HP_CHARACTER_FIXTURES,
  cookieHeaderAuthSessionIdParser,
  IdGeneratorRandom,
  CHARACTER_LEVEL_LADDER,
  GlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  UserGameDataPersistenceService,
  SpeedDungeonProfileService,
  InMemoryLadderRecordsPersistenceStrategy,
  LadderGameRecordsService,
  IdGenerator,
  DefaultCharacterCreationPolicy,
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

export class LobbyServerNode {
  private _lobbyServer: LobbyServer | null = null;

  async createServer(
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    gameSessionStoreService: GameSessionStoreService,
    globalGameSessionStore: GlobalGameSessionStore,
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
    const leastBusyGameServerUrlGetter = async () => {
      return { name: GAME_SERVER_NAME, url: "http://localhost:8090" };
    };
    // TO MATCH TEST SETUP
    // this._lobbyServer = new LobbyServer(
    //   usersIncomingConnectionGateway,
    //   externalServices,
    //   gameServerSessionClaimTokenCodec,
    //   guestReconnectionTokenCodec,
    //   { [GAME_SERVER_NAME]: "http://localhost:8090" },
    //   leastBusyGameServerUrlGetter,
    //   ScriptedCharacterCreationPolicy,
    //   RandomNumberGenerationPolicyFactory.allRandomPolicy(),
    //   new IdGeneratorSequential({ saveHistory: false, prefix: "lid" }),
    //   cookieHeaderAuthSessionIdParser
    // );

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

    // this._lobbyServer.characterCreationPolicy.setCharacters(BASIC_CHARACTER_FIXTURES);
    // this._lobbyServer.characterCreationPolicy.setCharacters(CHARARCTER_FIXTURES_WITH_PETS);
    // this._lobbyServer.characterCreationPolicy.setCharacters(LOW_HP_CHARACTER_FIXTURES);
    // this._lobbyServer.characterCreationPolicy.setCharacters(CHARARCTER_FIXTURES_WITH_PET_MANTAS);
    // this._lobbyServer.characterCreationPolicy.setCharacters(
    //   HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS([
    //     (idGenerator, itemBuilder, rngPolicy, name) =>
    //       MONSTER_FIXTURES.MANTA_RAY(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
    //   ])
    // );

    console.info("lobby server node created");
  }

  private createExternalServices(
    gameSessionStoreService: GameSessionStoreService,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    globalGameSessionStore: GlobalGameSessionStore,
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
      new InMemoryLadderRecordsPersistenceStrategy(),
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
