import {
  AffixGenerator,
  AssetCache,
  DungeonRoomType,
  EquipmentRandomizer,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameServerNodeAssetService,
  GameServerSessionClaimTokenCodec,
  GameSessionStoreService,
  IdGenerator,
  InMemoryRaceGameRecordsPersistenceStrategy,
  ItemBuilder,
  MonsterType,
  RaceGameRecordsService,
  ReconnectionForwardingStoreService,
  SavedCharactersService,
  ScriptedDungeonGenerationPolicy,
  SequentialNumberGenerator,
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
import { env } from "../validate-env.js";
import { RandomDungeonGenerationPolicy, BasicRandomNumberGenerator } from "@speed-dungeon/common";
import { MonsterGenerator } from "@speed-dungeon/common";

export class GameServerNode {
  private _server: GameServer | null = null;
  private _assetServer: AssetServer | null = null;

  async createServer(
    name: GameServerName,
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    expressApp: Express,
    reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    gameSessionStoreService: GameSessionStoreService,
    gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec
  ) {
    const fsAssetStore = new NodeFileSystemAssetStore("./assets");
    this._assetServer = new AssetServer(fsAssetStore);
    this._assetServer.attachRouter(expressApp, { isProduction: env.isProduction });

    const wss = new WebSocketServer({ server: httpServer });
    const incomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(wss);
    const externalServices = this.createExternalServices(
      fsAssetStore,
      reconnectionForwardingStoreService,
      gameSessionStoreService
    );

    this._server = new GameServer(
      name,
      incomingConnectionGateway,
      externalServices,
      gameServerSessionClaimTokenCodec,
      ScriptedDungeonGenerationPolicy,
      new SequentialNumberGenerator([0.1, 0.5, 1])
      // RandomDungeonGenerationPolicy,
      // new BasicRandomNumberGenerator()
    );

    const idGenerator = new IdGenerator({ saveHistory: false });
    const rng = new BasicRandomNumberGenerator();
    const affixGenerator = new AffixGenerator(rng);
    const equipmentRandomizer = new EquipmentRandomizer(rng, affixGenerator);
    const monsterGenerator = new MonsterGenerator(
      idGenerator,
      new ItemBuilder(equipmentRandomizer),
      rng
    );
    this._server.dungeonGenerationPolicy.setFloors([
      [
        {
          type: DungeonRoomType.MonsterLair,
          monsters: [monsterGenerator.generate(MonsterType.Wolf, 1)],
        },
      ],
    ]);

    await this._server.analyzeAssetsForGameplayRelevantData();
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
