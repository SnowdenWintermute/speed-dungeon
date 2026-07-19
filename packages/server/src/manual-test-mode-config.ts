import {
  AuthSessionIdParser,
  BASIC_CHARACTER_FIXTURES,
  CHARARCTER_FIXTURES_WITH_PET_MANTAS,
  FixedNumberGenerator,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameServerSessionClaimToken,
  GuestSessionReconnectionToken,
  HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS,
  IdGeneratorSequential,
  IncomingConnectionGateway,
  LobbyExternalServices,
  LobbyServer,
  MONSTER_FIXTURES,
  OpaqueEncryptionTokenCodec,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
  ScriptedCharacterCreationPolicy,
  ScriptedDungeonGenerationPolicy,
  TEST_DUNGEON_MANTA_TWO_WOLF,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
  TestResourceChangePropertiesStrategy,
} from "@speed-dungeon/common";
import { GAME_SERVER_NAME } from "./main.js";

export const MANUAL_TEST_MODE = true;

const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
export function setGameServerNodeManualTestProperties(
  name: GameServerName,
  gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
  guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
  incomingConnectionGateway: IncomingConnectionGateway,
  externalServices: GameServerExternalServices,
  authSessionIdParser: AuthSessionIdParser
) {
  const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
    counterAttack: fixedRngMinRoll,
    criticalStrike: fixedRngMinRoll,
    parry: fixedRngMinRoll,
    shieldBlock: fixedRngMinRoll,
    spellResist: fixedRngMinRoll,
  });
  const server = new GameServer(
    name,
    incomingConnectionGateway,
    externalServices,
    gameServerSessionClaimTokenCodec,
    guestReconnectionTokenCodec,
    ScriptedDungeonGenerationPolicy,
    rngPolicy,
    new TestResourceChangePropertiesStrategy(),
    new IdGeneratorSequential({ saveHistory: false, prefix: "gid" }),
    authSessionIdParser
  );

  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_SPIDER_ROOMS);
  server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_WOLF_ROOMS);
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_ONE_HP_WOLVES);
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_FOUR_ONE_HP_WOLVES);
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_ZERO_SPEED_MANTAS);
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_ZERO_SPEED_WOLVES);
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_ONE_ONE_HP_WOLF_ONE_NORMAL);
  // server.dungeonGenerationPolicy.setExplicitFloors(
  //   TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST
  // );
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_MID_HP_WOLVES);
  // server.dungeonGenerationPolicy.setExplicitFloors(
  //   TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA
  // );
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_MANTA_TWO_WOLF);
  // server.dungeonGenerationPolicy.setExplicitFloors(TEST_DUNGEON_TWO_SPIDER_ROOMS);
  return server;
}

export function setLobbyServerNodeManualTestProperties(
  incomingConnectionGateway: IncomingConnectionGateway,
  externalServices: LobbyExternalServices,
  gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
  guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
  leastBusyGameServerUrlGetter: () => Promise<{ name: GameServerName; url: string }>,
  cookieHeaderAuthSessionIdParser: AuthSessionIdParser
) {
  const server = new LobbyServer(
    incomingConnectionGateway,
    externalServices,
    gameServerSessionClaimTokenCodec,
    guestReconnectionTokenCodec,
    { [GAME_SERVER_NAME]: "http://localhost:8090" },
    leastBusyGameServerUrlGetter,
    ScriptedCharacterCreationPolicy,
    RandomNumberGenerationPolicyFactory.allRandomPolicy(),
    new IdGeneratorSequential({ saveHistory: false, prefix: "lid" }),
    cookieHeaderAuthSessionIdParser
  );

  // server.characterCreationPolicy.setCharacters(BASIC_CHARACTER_FIXTURES);
  // server.characterCreationPolicy.setCharacters(CHARARCTER_FIXTURES_WITH_PETS);

  // server.characterCreationPolicy.setCharacters(CREATE_SET_HP_CHARACTER_FIXTURES(1));
  // server.characterCreationPolicy.setCharacters(LOW_HP_CHARACTER_FIXTURES);
  // server.characterCreationPolicy.setCharacters(CHARARCTER_FIXTURES_WITH_PET_MANTAS);
  server.characterCreationPolicy.setCharacters(
    HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS([
      (idGenerator, itemBuilder, rngPolicy, name) =>
        MONSTER_FIXTURES.MANTA_RAY(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
    ])
  );

  return server;
}
