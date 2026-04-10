import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantClass,
  DungeonRoomType,
  EXPLICIT_ATTACK_TEST_DUNGEON,
  FixedNumberGenerator,
  invariant,
  NextOrPrevious,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
  TurnTrackerEntityType,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types.js";
import { testTwoSpidersAndBurning } from "./two-spiders-and-burning.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "explicit combatant attack",
  ({ clientEndpointFactory }) => {
    const testFixture = new IntegrationTestFixture(clientEndpointFactory);

    afterEach(async () => {
      await Promise.all([
        testFixture.lobbyServer.closeTransportServer(),
        testFixture.gameServer.closeTransportServer(),
      ]);
    });

    it("two spiders burning", async () => {
      await testTwoSpidersAndBurning(testFixture);
    });

    it("doesn't block turn order", async () => {
      const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
      const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
        counterAttack: fixedRngMinRoll,
        criticalStrike: fixedRngMinRoll,
        parry: fixedRngMinRoll,
        shieldBlock: fixedRngMinRoll,
      });
      await testFixture.createServers(
        rngPolicy,
        TEST_DUNGEON_TWO_SPIDER_ROOMS,
        BASIC_CHARACTER_FIXTURES
      );

      const client = testFixture.createClient("client 1");
      await client.connect();

      await client.lobbyClientHarness.createGame("a");
      await client.lobbyClientHarness.createParty("a");
      await client.lobbyClientHarness.createCharacter("a", CombatantClass.Warrior);
      await client.lobbyClientHarness.createCharacter("b", CombatantClass.Rogue);
      await client.lobbyClientHarness.toggleReadyToStartGame();
      const { clientApplication, gameClientHarness } = client;
      await clientApplication.sequentialEventProcessor.waitUntilIdle();
      await clientApplication.transitionToGameServer.waitFor();

      const { gameContext } = clientApplication;
      const game = gameContext.requireGame();
      const party = gameContext.requireParty();

      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
      await gameClientHarness.toggleReadyToExplore();
      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

      // enemy dies in firewall on way to melee
      // enemy dies in firewall comming back from melee
      // arrows light on fire (deal fire damage)
      // arrows disintigrate
      // counterattack + enemy countered is hit from firewally on way back from getting counterattacked:
      // - doesn't unlock input early
      // firewall deteriorates stacks/ranks
      // firewall can be stoked by recast
      // disappears on new room entered
    });
  }
);
