import {
  AssetCache,
  CrossServerBroadcasterService,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameServerNodeAssetService,
  GameSessionStoreService,
  GameStateUpdate,
  ScriptedDungeonGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  ServerCommand,
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
  TEST_DUNGEON_TWO_ONE_HP_WOLVES,
  cookieHeaderAuthSessionIdParser,
  IdGeneratorRandom,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
  CHARACTER_LEVEL_LADDER,
  GlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  UserGameDataPersistenceService,
  GuestSessionReconnectionToken,
  SpeedDungeonProfileService,
} from "@speed-dungeon/common";
import { Server, IncomingMessage, ServerResponse } from "http";
import { AssetServer } from "../asset-server/index.js";
import { NodeFileSystemAssetStore } from "../services/assets/stores/node-file-system.js";
import { Express } from "express";
import { WebSocketServer } from "ws";
import { NodeWebSocketIncomingConnectionGateway } from "../servers/node-websocket-incoming-connection-gateway.js";
import {
  DatabaseIronmanRunPersistenceStrategy,
  DatabaseSavedCharacterPersistenceStrategy,
} from "./services/user-game-data-persistence.js";
import { DatabaseRankedLadderService } from "./services/ranked-ladder.js";
import { valkeyManager } from "../kv-store/index.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";
import { savedIronmanRunsRepo } from "../database/repos/saved-ironman-runs.js";
import { env } from "../validate-env.js";

export class GameServerNode {
  private _server: GameServer | null = null;
  private _assetServer: AssetServer | null = null;

  async createServer(
    name: GameServerName,
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    expressApp: Express,
    profileService: SpeedDungeonProfileService,
    gameSessionStoreService: GameSessionStoreService,
    globalGameSessionStore: GlobalGameSessionStore,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>
  ) {
    const fsAssetStore = new NodeFileSystemAssetStore("./assets");
    this._assetServer = new AssetServer(fsAssetStore);
    this._assetServer.attachRouter(expressApp, { isProduction: env.isProduction });

    const wss = new WebSocketServer({ server: httpServer });
    const incomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(wss);
    const externalServices = this.createExternalServices(
      fsAssetStore,
      gameSessionStoreService,
      crossServerBroadcasterService,
      globalGameSessionStore,
      profileService
    );

    const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
    const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
      counterAttack: fixedRngMinRoll,
      criticalStrike: fixedRngMinRoll,
      parry: fixedRngMinRoll,
      shieldBlock: fixedRngMinRoll,
      spellResist: fixedRngMinRoll,
    });
    // const rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();

    this._server = new GameServer(
      name,
      incomingConnectionGateway,
      externalServices,
      gameServerSessionClaimTokenCodec,
      guestReconnectionTokenCodec,
      ScriptedDungeonGenerationPolicy,
      rngPolicy,
      // new IdGeneratorSequential({ saveHistory: false, prefix: "gid" }),
      new IdGeneratorRandom({ saveHistory: false }),
      cookieHeaderAuthSessionIdParser
      // RandomDungeonGenerationPolicy,
      // allRandomPolicy()
    );

    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_SPIDER_ROOMS);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_WOLF_ROOMS);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_ONE_HP_WOLVES);
    this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_FOUR_ONE_HP_WOLVES);
    // this._server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_ZERO_SPEED_MANTAS);
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
    gameSessionStoreService: GameSessionStoreService,
    crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
    globalGameSessionStore: GlobalGameSessionStore,
    profileService: SpeedDungeonProfileService
  ): GameServerExternalServices {
    const assetService = new GameServerNodeAssetService(assetStore);

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

    const rankedLadderService = new DatabaseRankedLadderService(valkeyManager.context);

    const result: GameServerExternalServices = {
      gameSessionStoreService,
      userGameDataPersistenceService,
      rankedLadderService,
      assetService,
      crossServerBroadcasterService,
      globalGameSessionStore,
      profileService,
    };
    return result;
  }
}
