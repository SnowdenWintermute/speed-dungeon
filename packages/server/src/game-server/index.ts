import {
  AssetCache,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameServerNodeAssetService,
  GameSessionStoreService,
  InMemoryGameSessionStoreService,
  InMemoryRaceGameRecordsPersistenceStrategy,
  InMemoryReconnectionForwardingStoreService,
  OpaqueEncryptionSessionClaimTokenCodec,
  RaceGameRecordsService,
  ReconnectionForwardingStoreService,
  SavedCharactersService,
  SodiumHelpers,
} from "@speed-dungeon/common";
import { Server, IncomingMessage, ServerResponse } from "http";
import { AssetServer } from "../asset-server/index.js";
import { NodeFileSystemAssetStore } from "../services/assets/stores/node-file-system.js";
import { Express } from "express";
import { WebSocketServer } from "ws";
import { NodeWebSocketIncomingConnectionGateway } from "../servers/node-websocket-incoming-connection-gateway.js";
import {
  DatabaseSavedCharacterPersistenceStrategy,
  DatabaseSavedCharacterSlotsPersistenceStrategy,
} from "./services/saved-characters.js";
import { characterSlotsRepo } from "../database/repos/character-slots.js";
import { DatabaseRankedLadderService } from "./services/ranked-ladder.js";
import { valkeyManager } from "../kv-store/index.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";

export class GameServerNode {
  private _server: GameServer | null = null;
  private _assetServer: AssetServer | null = null;

  async createServer(
    name: GameServerName,
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    expressApp: Express,
    reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    gameSessionStoreService: GameSessionStoreService
  ) {
    const fsAssetStore = new NodeFileSystemAssetStore("/packages/server/assets");
    this._assetServer = new AssetServer(fsAssetStore);
    this._assetServer.attachRouter(expressApp);

    const wss = new WebSocketServer({ server: httpServer });
    const incomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(wss);
    const externalServices = this.createExternalServices(
      fsAssetStore,
      reconnectionForwardingStoreService,
      gameSessionStoreService
    );

    const secret = await SodiumHelpers.createSecret();
    const codec = new OpaqueEncryptionSessionClaimTokenCodec(secret);
    this._server = new GameServer(name, incomingConnectionGateway, externalServices, codec);
  }

  private createExternalServices(
    assetStore: AssetCache,
    reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    gameSessionStoreService: GameSessionStoreService
  ): GameServerExternalServices {
    const assetService = new GameServerNodeAssetService(assetStore);

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

    // @TODO - make postgres version
    const raceGameRecordsPersistenceStrategy = new InMemoryRaceGameRecordsPersistenceStrategy();
    const raceGameRecordsService = new RaceGameRecordsService(raceGameRecordsPersistenceStrategy);

    const result: GameServerExternalServices = {
      gameSessionStoreService,
      reconnectionForwardingStoreService,
      savedCharactersService,
      rankedLadderService,
      raceGameRecordsService,
      assetService,
    };
    return result;
  }
}
