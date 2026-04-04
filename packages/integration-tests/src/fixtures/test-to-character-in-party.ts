import { ClientApplication } from "@/client-application";
import { LobbyClient } from "@/client-application/clients/lobby";
import { ClientTestHarness } from "@/test-utils/client-test-harness";
import {
  ClientIntentType,
  CombatantClass,
  EntityName,
  GameMode,
  GameName,
  PartyName,
} from "@speed-dungeon/common";

export async function testToCharacterInParty(
  lobbyClientHarness: ClientTestHarness<LobbyClient>,
  clientApplication: ClientApplication,
  combatantClass: CombatantClass,
  gameName: string
) {
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.CreateGame,
    data: { gameName: gameName as GameName, mode: GameMode.Race },
  });
  expect(clientApplication.gameContext.requireGame().name).toBe(gameName);
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.CreateParty,
    data: { partyName: "a" as PartyName },
  });
  expect(clientApplication.gameContext.requireParty().name).toBe("a");
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.CreateCharacter,
    data: { name: "a" as EntityName, combatantClass },
  });
  expect(
    clientApplication.gameContext.requireParty().combatantManager.getAllCombatants().size
  ).toBe(1);
}
