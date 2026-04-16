import {
  AssetCache,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameServerNodeAssetService,
  GameServerSessionClaimTokenCodec,
  GameSessionStoreService,
  InMemoryRaceGameRecordsPersistenceStrategy,
  RaceGameRecordsService,
  ReconnectionForwardingStoreService,
  SavedCharactersService,
  ScriptedDungeonGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  FixedNumberGenerator,
  RNG_RANGE,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
  IdGeneratorSequential,
  EXPLICIT_ATTACK_TEST_DUNGEON,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
  TEST_DUNGEON_ONE_LOW_HP_WOLF_ONE_NORMAL,
  TEST_DUNGEON_ONE_MID_HP_WOLF_ONE_NORMAL,
  TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST,
  TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA,
  TEST_DUNGEON_MANTA_TWO_WOLF,
  TEST_DUNGEON_TWO_MID_HP_WOLVES,
  TEST_DUNGEON_ZERO_SPEED_MANTAS,
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

    // const basicRng = new BasicRandomNumberGenerator();
    const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
    const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
      counterAttack: fixedRngMinRoll,
      criticalStrike: fixedRngMinRoll,
      parry: fixedRngMinRoll,
      shieldBlock: fixedRngMinRoll,
      spellResist: fixedRngMinRoll,
    });

    this._server = new GameServer(
      name,
      incomingConnectionGateway,
      externalServices,
      gameServerSessionClaimTokenCodec,
      ScriptedDungeonGenerationPolicy,
      rngPolicy,
      new IdGeneratorSequential({ saveHistory: false, prefix: "gid" })
      // RandomDungeonGenerationPolicy,
      // allRandomPolicy()
    );

    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_SPIDER_ROOMS);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_WOLF_ROOMS);
    this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_ZERO_SPEED_MANTAS);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_ZERO_SPEED_WOLVES);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_ONE_LOW_HP_WOLF_ONE_NORMAL);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_MID_HP_WOLVES);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(
    //   TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA
    // );
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_MANTA_TWO_WOLF);

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
