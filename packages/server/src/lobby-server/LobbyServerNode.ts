/* eslint-disable @typescript-eslint/no-extraneous-class */
import {
  LobbyServer,
  SodiumHelpers,
  OpaqueEncryptionSessionClaimTokenCodec,
  LobbyExternalServices,
  IdentityProviderService,
  ConnectionIdentityResolutionContext,
  SavedCharactersService,
  InMemoryReconnectionForwardingStoreService,
  InMemoryGameSessionStoreService,
  IdGenerator,
} from "@speed-dungeon/common";
import { WebSocketServer } from "ws";
import { characterSlotsRepo } from "../database/repos/character-slots.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { getLoggedInUserOrCreateGuest } from "../game-server/get-logged-in-user-or-create-guest.js";
import { DatabaseProfileService } from "../game-server/services/profiles.js";
import { DatabaseRankedLadderService } from "../game-server/services/ranked-ladder.js";
import {
  DatabaseSavedCharacterPersistenceStrategy,
  DatabaseSavedCharacterSlotsPersistenceStrategy,
} from "../game-server/services/saved-characters.js";
import { valkeyManager } from "../kv-store/index.js";
import { NodeWebSocketIncomingConnectionGateway } from "../servers/node-websocket-incoming-connection-gateway.js";
import { Server, IncomingMessage, ServerResponse } from "http";

export class LobbyServerNode {
  static _lobbyServer: LobbyServer | null = null;

  static getServer() {
    if (this._lobbyServer === null) {
      throw new Error("Lobby server not yet created");
    }
    return this._lobbyServer;
  }

  static async createLobbyServer(
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>
  ) {
    const wss = new WebSocketServer({ server: httpServer });
    const usersIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(wss);
    const externalServices = this.createExternalServices();
    const testSecret = await SodiumHelpers.createSecret();
    const codec = new OpaqueEncryptionSessionClaimTokenCodec(testSecret);
    LobbyServerNode._lobbyServer = new LobbyServer(
      usersIncomingConnectionGateway,
      externalServices,
      codec,
      {},
      async () => ""
    );

    console.log("lobby server node created");
  }

  private static createExternalServices(): LobbyExternalServices {
    const identityProviderService = new IdentityProviderService({
      execute: async (context: ConnectionIdentityResolutionContext) => {
        // @TODO - this is wrong because this old fn expects cookies, not authSessionId
        return await getLoggedInUserOrCreateGuest(context.authSessionId);
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

    // @TODO - make valkey version
    const reconnectionForwardingStoreService = new InMemoryReconnectionForwardingStoreService();
    // @TODO - make valkey version
    const gameSessionStoreService = new InMemoryGameSessionStoreService();

    const externalServices: LobbyExternalServices = {
      identityProviderService,
      profileService,
      savedCharactersService,
      rankedLadderService,
      idGenerator: new IdGenerator({ saveHistory: false }),
      gameSessionStoreService,
      reconnectionForwardingStoreService,
    };

    return externalServices;
  }
}
