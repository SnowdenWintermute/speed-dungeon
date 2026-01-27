import { EntityName } from "../../../../aliases.js";
import { CombatantClass } from "../../../../combatants/combatant-class/classes.js";
import { ClientIntentType } from "../../../../packets/client-intents.js";
import { GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { ClientEndpointFactory } from "../test-connection-endpoint-factories.js";
import { testGameSetupToTwoPlayersInParty } from "./two-players-in-party.js";

export async function testGameSetupToTwoPlayersInPartyWithCharacters(
  clientEndpointFactory: ClientEndpointFactory
) {
  const { hostClient, joinerClient } =
    await testGameSetupToTwoPlayersInParty(clientEndpointFactory);

  await hostClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.CreateCharacter,
      data: { combatantClass: CombatantClass.Warrior, name: "" as EntityName },
    },
    GameStateUpdateType.CharacterAddedToParty
  );

  await joinerClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.CreateCharacter,
      data: { combatantClass: CombatantClass.Mage, name: "" as EntityName },
    },
    GameStateUpdateType.CharacterAddedToParty
  );

  return { hostClient, joinerClient };
}
