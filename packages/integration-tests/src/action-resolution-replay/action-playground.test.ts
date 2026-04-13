import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture.js";
import { testFirewallStokedOnRecast } from "./firewall/stoked-on-recast.js";
import { testFirewallDeteriorates } from "./firewall/deteriorates.js";
import { testFirewallDissipateOnExplore } from "./firewall/dissipates-on-explore.js";
import { deathInFirewallOnMeleeApproach } from "./firewall/death-on-melee-approach.js";
import { deathInFirewallOnMeleeReturnHome } from "./firewall/death-on-melee-return-home.js";
import { testFirewallIncineratesProjectiles } from "./firewall/projectiles-incinerate.js";
import { testFirewallIgnitesProjectiles } from "./firewall/projectiles-ignite.js";
import { testOnlyTameDamagedTameableCombatants } from "./tame-pet/only-tame-tameable-combatants.js";
import { testTamingRemovesWeb } from "./tame-pet/taming-removes-web.js";
import { testDismissPetRemovesWeb } from "./tame-pet/dismiss-pet-removes-web.js";
import { testSummonedPetTickableConditions } from "./tame-pet/summoned-pet-tickable-conditions.js";
import { testSummonedPetTurnOrder } from "./tame-pet/pet-summoned-turn-order.js";
import { testPetSlotLimitations } from "./tame-pet/pet-slots.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "action playground",
  ({ clientEndpointFactory }) => {
    const testFixture = new IntegrationTestFixture(clientEndpointFactory);

    afterEach(async () => {
      await Promise.all([
        testFixture.lobbyServer.closeTransportServer(),
        testFixture.gameServer.closeTransportServer(),
      ]);
    });

    // PETS
    // can not tame pet if slots are full
    // release pet frees up slot
    // can not tame pet above rank limit pet level
    // pet ai with no active pet command
    // pet ai with pet command
    // pet can not level up beyond rank limit pet level
    it("tame pet slots", async () => {
      await testPetSlotLimitations(testFixture);
    });

    // it("summoned pet turn order", async () => {
    //   await testSummonedPetTurnOrder(testFixture);
    // });

    // it("summoned pet tickable conditions", async () => {
    //   await testSummonedPetTickableConditions(testFixture);
    // });

    // it("dismiss pet removes web", async () => {
    //   await testDismissPetRemovesWeb(testFixture);
    // });

    // it("taming removes web", async () => {
    //   await testTamingRemovesWeb(testFixture);
    // });

    // it("only tame tameable damaged combatants", async () => {
    //   await testOnlyTameDamagedTameableCombatants(testFixture);
    // });

    // // // FIREWALL
    // it("firewall ignites projectiles", async () => {
    //   await testFirewallIgnitesProjectiles(testFixture);
    // });

    // it("firewall incinerates projectiles", async () => {
    //   await testFirewallIncineratesProjectiles(testFixture);
    // });

    // it("death in firewall on return", async () => {
    //   await deathInFirewallOnMeleeReturnHome(testFixture);
    // });

    // it("death in firewall on approach", async () => {
    //   await deathInFirewallOnMeleeApproach(testFixture);
    // });

    // it("firewall dissipates after explore", async () => {
    //   await testFirewallDissipateOnExplore(testFixture);
    // });

    // it("firewall deteriorates", async () => {
    //   await testFirewallDeteriorates(testFixture);
    // });

    // it("firewall stoked by recast", async () => {
    //   await testFirewallStokedOnRecast(testFixture);
    // });

    // // LEGACY/NEEDS REDO:
    // // it("two spiders burning", async () => {
    // //   await testTwoSpidersAndBurning(testFixture);
    // // });
  }
);
