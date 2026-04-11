import {
  ActionEntityName,
  ActionResolutionStepType,
  BASIC_CHARACTER_FIXTURES,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  CombatantClass,
  DungeonRoomType,
  MONSTER_FIXTURE_NAMES,
  TEST_DUNGEON_ONE_LOW_HP_WOLF_ONE_NORMAL,
  TEST_DUNGEON_ONE_MID_HP_WOLF_ONE_NORMAL,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";
import { testTwoSpidersAndBurning } from "./two-spiders-and-burning.js";
import { testFirewallStokedOnRecast } from "./firewall/stoked-on-recast.js";
import { testFirewallDeteriorates } from "./firewall/deteriorates.js";
import { testFirewallDissipateOnExplore } from "./firewall/dissipates-on-explore.js";
import { deathInFirewallOnMeleeApproach } from "./firewall/death-on-melee-approach.js";
import { deathInFirewallOnMeleeReturnHome } from "./firewall/death-on-melee-return-home.js";

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

    // arrows light on fire (deal fire damage)
    // arrows disintigrate
    // counterattack + enemy countered is hit from firewally on way back from getting counterattacked:
    // - doesn't unlock input early

    it("death in firewall on return", async () => {
      await deathInFirewallOnMeleeReturnHome(testFixture);
    });

    it("death in firewall on approach", async () => {
      await deathInFirewallOnMeleeApproach(testFixture);
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
