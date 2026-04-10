import {
  ActionEntityName,
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantClass,
  DungeonRoomType,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";
import { testTwoSpidersAndBurning } from "./two-spiders-and-burning.js";
import { testFirewallStokedOnRecast } from "./firewall/stoked-on-recast.js";
import { testFirewallDeteriorates } from "./firewall/deteriorates.js";
import { testFirewallDissipateOnExplore } from "./firewall/dissipates-on-explore.js";

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

    it("firewall", async () => {
      const client = await testFixture.resetWithOptions(
        TEST_DUNGEON_TWO_WOLF_ROOMS,
        BASIC_CHARACTER_FIXTURES,
        [
          { name: "a", combatantClass: CombatantClass.Warrior },
          { name: "b", combatantClass: CombatantClass.Rogue },
        ]
      );

      const { clientApplication, gameClientHarness } = client;
      const { gameContext } = clientApplication;
      const party = gameContext.requireParty();
      await gameClientHarness.toggleReadyToExplore();
      await gameClientHarness.useCombatAction(CombatActionName.Firewall, 3);

      // enemy dies in firewall on way to melee
      // enemy dies in firewall comming back from melee
      // arrows light on fire (deal fire damage)
      // arrows disintigrate
      // counterattack + enemy countered is hit from firewally on way back from getting counterattacked:
      // - doesn't unlock input early
    });

    it("two spiders burning", async () => {
      await testTwoSpidersAndBurning(testFixture);
    });

    it("firewall dissipates after explore", async () => {
      await testFirewallDissipateOnExplore(testFixture);
    });

    it("firewall deteriorates", async () => {
      await testFirewallDeteriorates(testFixture);
    });

    it("firewall stoked by recast", async () => {
      await testFirewallStokedOnRecast(testFixture);
    });
  }
);
