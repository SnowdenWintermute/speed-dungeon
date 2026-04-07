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
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../test-utils/time-machine.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "explicit combatant attack",
  ({ clientEndpointFactory }) => {
    const testFixture = new IntegrationTestFixture(clientEndpointFactory, new TimeMachine());

    beforeEach(() => {
      testFixture.timeMachine.returnToPresent();
      testFixture.timeMachine.start();
    });

    afterEach(async () => {
      await Promise.all([
        testFixture.lobbyServer.closeTransportServer(),
        testFixture.gameServer.closeTransportServer(),
      ]);
    });

    it("web release condition after", async () => {
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
      await client.lobbyClientHarness.createCharacter("a", CombatantClass.Warrior);
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
      let focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
      await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);
      focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();

      await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);
      focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();

      await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);
      focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
      // cycle next x3
      // cycle scheme
      // use fire rank 3
      await gameClientHarness.selectCombatAction(focusedCharacterId, CombatActionName.Fire, 3);
      await gameClientHarness.cycleTargets(focusedCharacterId, NextOrPrevious.Next);
      await gameClientHarness.cycleTargets(focusedCharacterId, NextOrPrevious.Next);
      await gameClientHarness.cycleTargets(focusedCharacterId, NextOrPrevious.Next);
      await gameClientHarness.cycleTargetingSchemes(focusedCharacterId);
      await gameClientHarness.useSelectedCombatAction(focusedCharacterId);
      // pass turn
      focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
      await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);
      // spiders should die from burning

      const aSpider = party.combatantManager.getDungeonControlledCombatants()[0];
      console.log(aSpider?.combatantProperties.resources.getHitPoints());
      //
      expect(party.combatantManager.getDungeonControlledCombatants().length).toBe(0);
      // assert no web condition on either combatant
    });

    // it("simple attack", async () => {
    //   const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
    //   const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
    //     counterAttack: fixedRngMinRoll,
    //     criticalStrike: fixedRngMinRoll,
    //     parry: fixedRngMinRoll,
    //   });
    //   await testFixture.createServers(
    //     rngPolicy,
    //     EXPLICIT_ATTACK_TEST_DUNGEON,
    //     BASIC_CHARACTER_FIXTURES
    //   );

    //   const client = testFixture.createClient("client 1");
    //   await client.connect();

    //   await client.lobbyClientHarness.createGame("a");
    //   await client.lobbyClientHarness.createParty("a");
    //   await client.lobbyClientHarness.createCharacter("a", CombatantClass.Warrior);
    //   await client.lobbyClientHarness.toggleReadyToStartGame();
    //   const { clientApplication, gameClientHarness } = client;
    //   await clientApplication.sequentialEventProcessor.waitUntilIdle();
    //   await clientApplication.transitionToGameServer.waitFor();

    //   const { gameContext } = clientApplication;

    //   expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
    //   await gameClientHarness.toggleReadyToExplore();
    //   expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

    //   const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
    //   const characterId = focusedCharacter.getEntityId();

    //   expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(100);
    //   const wolf = gameContext.requireParty().combatantManager.getDungeonControlledCombatants()[0];
    //   invariant(wolf !== undefined);
    //   expect(wolf.combatantProperties.resources.getHitPoints()).toBe(50);

    //   await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);

    //   expect(wolf.combatantProperties.resources.getHitPoints()).toBe(40);
    //   expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(91);
    // });
  }
);
