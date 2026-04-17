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
import { testPetAiKill } from "./tame-pet/pet-ai-kill.js";
import { testPetAiAssist } from "./tame-pet/pet-ai-assist.js";
import { testTamedPetHealsAlliesAttacksMonsters } from "./tame-pet/tamed-pet-attacks-monsters.js";
import { testCombatantDiesWhilePrimedForIceBurst } from "./ice-burst/combatant-dies-while-primed.js";
import { testIceBurstOnWebRemovedAtBattleEnd } from "./ice-burst/ice-burst-on-web-removed-on-battle-end.js";
import { testIceBurstAppliesPrimedForIceBurst } from "./ice-burst/ice-burst-applies-primed-for-ice-burst.js";
import { testIceBurstTriggeredByFirewall } from "./ice-burst/ice-burst-in-firewall.js";
import { testEnsnareDebuffOnFlyer } from "./ensnare/ensnare-debuff-on-flyer.js";
import { testDieFromCounterattackTriggeredExplosion } from "./counterattack/die-from-effect-triggered-by-own-counterattack.js";
import { testRangedCounterattackThroughFirewall } from "./counterattack/ranged-counterattack-through-firewall.js";

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

    // COUNTERATTACK
    // counterattack + enemy countered is hit from firewall on way back from getting counterattacked:
    // - doesn't unlock input early
    // ranged counterattack through firewall incinerates (does no damage)
    // ranged counterattack through firewall ignites projectile
    // ranged counterattack against monster that dies in firewall before arrow has chance to land
    it("ranged counterattack through firewall", async () => {
      await testRangedCounterattackThroughFirewall(testFixture);
    });

    // it("die from counterattack triggered explosion", async () => {
    //   await testDieFromCounterattackTriggeredExplosion(testFixture);
    // });

    // it("ensnare debuff", async () => {
    //   await testEnsnareDebuffOnFlyer(testFixture);
    // });

    // it("ice burst crossing firewall", async () => {
    //   await testIceBurstTriggeredByFirewall(testFixture);
    // });

    // it("ice burst applies primed for ice burst", async () => {
    //   await testIceBurstAppliesPrimedForIceBurst(testFixture);
    // });

    // it("ice burst on web removed at battle end", async () => {
    //   await testIceBurstOnWebRemovedAtBattleEnd(testFixture);
    // });

    // it("combatant dies while primed for ice burst", async () => {
    //   // if killed with primed for ice burst as last monster, don't error
    //   await testCombatantDiesWhilePrimedForIceBurst(testFixture);
    // });

    // it("tamed pet attacks monsters", async () => {
    //   await testTamedPetHealsAlliesAttacksMonsters(testFixture);
    // });

    // // PETS
    // it("pet ai assist", async () => {
    //   await testPetAiAssist(testFixture);
    // });

    // it("pet ai kill", async () => {
    //   await testPetAiKill(testFixture);
    // });

    // it("tame pet slots", async () => {
    //   await testPetSlotLimitations(testFixture);
    // });

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
  }
);
