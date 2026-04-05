import {
  EXPLICIT_ATTACK_TEST_DUNGEON,
  ScriptedCharacterCreationPolicy,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../test-utils/time-machine.js";
import { enterTestGameSingleCharacter } from "@/fixtures/enter-test-game-single-character.js";
import { IntegrationTestFixture } from "@/types.js";
import {
  configureExplicitAttackTestCharacters,
  testExplicitCombatantAttack,
} from "./test-explicit-combatant-attack.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "explicit combatant attack",
  ({ clientEndpointFactory }) => {
    let testFixture: IntegrationTestFixture;
    const timeMachine = new TimeMachine();

    afterEach(async () => {
      testFixture.lobbyServer.closeTransportServer();
      testFixture.gameServer.closeTransportServer();
      timeMachine.returnToPresent();
    });

    it("warrior attacks wolf with explicit stats", async () => {
      const setup = await enterTestGameSingleCharacter(
        clientEndpointFactory,
        timeMachine,
        "game 1",
        EXPLICIT_ATTACK_TEST_DUNGEON,
        {
          characterCreationPolicyConstructor: ScriptedCharacterCreationPolicy,
          beforeCharacterCreation: configureExplicitAttackTestCharacters,
        }
      );
      testFixture = { ...testFixture, ...setup };
      await testExplicitCombatantAttack(testFixture);
    });
  }
);
