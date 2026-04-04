import { ClientApplication } from "@/client-application";
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
  lobbyClientHarness: ClientTestHarness,
  clientApplication: ClientApplication,
  combatantClass: CombatantClass
) {
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.CreateGame,
    data: { gameName: "a" as GameName, mode: GameMode.Race },
  });
  expect(clientApplication.gameContext.requireGame().name).toBe("a");
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
