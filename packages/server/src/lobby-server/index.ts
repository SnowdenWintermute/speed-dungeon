import {
  LobbyServer,
  LobbyExternalServices,
  IdentityProviderService,
  ConnectionIdentityResolutionContext,
  SavedCharactersService,
  ReconnectionForwardingStoreService,
  GameSessionStoreService,
  GameServerSessionClaimTokenCodec,
  RandomNumberGenerationPolicyFactory,
  ScriptedCharacterCreationPolicy,
  BASIC_CHARACTER_FIXTURES,
  IdGeneratorSequential,
  CHARARCTER_FIXTURES_WITH_PETS,
} from "@speed-dungeon/common";
import { WebSocketServer } from "ws";
import { characterSlotsRepo } from "../database/repos/character-slots.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { DatabaseProfileService } from "../game-server/services/profiles.js";
import { DatabaseRankedLadderService } from "../game-server/services/ranked-ladder.js";
import {
  DatabaseSavedCharacterPersistenceStrategy,
  DatabaseSavedCharacterSlotsPersistenceStrategy,
} from "../game-server/services/saved-characters.js";
import { valkeyManager } from "../kv-store/index.js";
import { NodeWebSocketIncomingConnectionGateway } from "../servers/node-websocket-incoming-connection-gateway.js";
import { Server, IncomingMessage, ServerResponse } from "http";
import { getLoggedInUserOption } from "../game-server/get-logged-in-user-option.js";

export class LobbyServerNode {
  private _lobbyServer: LobbyServer | null = null;

  async createServer(
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    gameSessionStoreService: GameSessionStoreService,
    gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec
  ) {
    const wss = new WebSocketServer({ server: httpServer });
    const usersIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(wss);
    const externalServices = this.createExternalServices(
      reconnectionForwardingStoreService,
      gameSessionStoreService
    );
    const leastBusyGameServerUrlGetter = async () => "http://localhost:8090";
    this._lobbyServer = new LobbyServer(
      usersIncomingConnectionGateway,
      externalServices,
      gameServerSessionClaimTokenCodec,
      {},
      leastBusyGameServerUrlGetter,
      // DefaultCharacterCreationPolicy,
      ScriptedCharacterCreationPolicy,
      RandomNumberGenerationPolicyFactory.allRandomPolicy(),
      new IdGeneratorSequential({ saveHistory: false, prefix: "lid" })
    );

    // this._lobbyServer.characterCreationPolicy.setCharacters(BASIC_CHARACTER_FIXTURES);
    this._lobbyServer.characterCreationPolicy.setCharacters(CHARARCTER_FIXTURES_WITH_PETS);

    console.info("lobby server node created");
  }

  private createExternalServices(
    reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    gameSessionStoreService: GameSessionStoreService
  ): LobbyExternalServices {
    const identityProviderService = new IdentityProviderService({
      execute: async (context: ConnectionIdentityResolutionContext) => {
        return await getLoggedInUserOption(context.authSessionId);
      },
    });

    const profileService = new DatabaseProfileService(speedDungeonProfilesRepo);

    const savedCharactersPersistenceStrategy = new DatabaseSavedCharacterPersistenceStrategy(
      playerCharactersRepo
    );

    const savedCharacterSlotsPersistenceStrategy =
      new DatabaseSavedCharacterSlotsPersistenceStrategy(characterSlotsRepo);
    const savedCharactersService = new SavedCharactersService(
      savedCharacterSlotsPersistenceStrategy,
      savedCharactersPersistenceStrategy
    );
    const rankedLadderService = new DatabaseRankedLadderService(valkeyManager.context);

    const externalServices: LobbyExternalServices = {
      identityProviderService,
      profileService,
      savedCharactersService,
      rankedLadderService,
      gameSessionStoreService,
      reconnectionForwardingStoreService,
    };

    return externalServices;
  }
}
