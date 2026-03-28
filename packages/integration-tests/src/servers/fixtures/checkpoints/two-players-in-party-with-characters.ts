import {
  ClientIntentType,
  CombatantClass,
  EntityName,
  GameStateUpdateType,
} from "@speed-dungeon/common";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "../test-connection-endpoint-factories.js";
import { testGameSetupToTwoPlayersInParty } from "./two-players-in-party.js";

export async function testGameSetupToTwoPlayersInPartyWithCharacters(
  clientEndpointFactory: ClientEndpointFactory,
  authSessionIds?: TestAuthSessionIds
) {
  const { hostClient, joinerClient } = await testGameSetupToTwoPlayersInParty(
    clientEndpointFactory,
    authSessionIds
  );

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
