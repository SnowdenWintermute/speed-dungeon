import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantClass,
  DungeonRoomType,
  EXPLICIT_ATTACK_TEST_DUNGEON,
  FixedNumberGenerator,
  invariant,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../test-utils/time-machine.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "explicit combatant attack",
  ({ clientEndpointFactory }) => {
    const testFixture = new IntegrationTestFixture(clientEndpointFactory, new TimeMachine());
    const timeMachine = new TimeMachine();

    afterEach(async () => {
      testFixture.lobbyServer.closeTransportServer();
      testFixture.gameServer.closeTransportServer();
      timeMachine.returnToPresent();
    });

    it("warrior attacks wolf with explicit stats", async () => {
      const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
      const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
        counterAttack: fixedRngMinRoll,
        criticalStrike: fixedRngMinRoll,
      });
      await testFixture.createServers(
        rngPolicy,
        EXPLICIT_ATTACK_TEST_DUNGEON,
        BASIC_CHARACTER_FIXTURES
      );

      const client = testFixture.createClient("client 1");
      await client.connect();

      await client.lobbyClientHarness.createGame("a");
      await client.lobbyClientHarness.createParty("a");
      await client.lobbyClientHarness.createCharacter("a", CombatantClass.Warrior);
      await client.lobbyClientHarness.toggleReadyToStartGame();
      const { clientApplication, gameClientHarness } = client;
      await clientApplication.sequentialEventProcessor.waitUntilIdle();
      await clientApplication.transitionToGameServer.waitFor();

      const { gameContext } = clientApplication;

      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
      await gameClientHarness.toggleReadyToExplore();
      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

      const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
      const characterId = focusedCharacter.getEntityId();

      expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(100);
      const wolf = gameContext.requireParty().combatantManager.getDungeonControlledCombatants()[0];
      invariant(wolf !== undefined);
      expect(wolf.combatantProperties.resources.getHitPoints()).toBe(50);

      await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);

      expect(wolf.combatantProperties.resources.getHitPoints()).toBe(46);
      expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(91);
    });
  }
);
