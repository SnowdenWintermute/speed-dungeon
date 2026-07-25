import { ClientApplication } from "@/client-application";
import { GameLogMessageStyle } from "@/client-application/event-log/game-log-messages";
import {
  Combatant,
  Username,
  createLadderDeathsMessage,
  createLevelLadderExpRankMessage,
  createLevelLadderLevelupMessage,
} from "@speed-dungeon/common";

export function gotLadderLevelUpMessage(
  clientApplication: ClientApplication,
  ownerUsername: Username,
  character: Combatant
) {
  const expectedLadderLevelupMessage = clientApplication.eventLogStore.getMessages().at(-2);
  expect(expectedLadderLevelupMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
  expect(expectedLadderLevelupMessage?.message?.toString()).toBe(
    createLevelLadderLevelupMessage(
      character.entityProperties.name,
      ownerUsername,
      character.getLevel(),
      0
    )
  );
}

export function gotLadderExperienceMessage(
  clientApplication: ClientApplication,
  ownerUsername: Username,
  character: Combatant
) {
  const expectedLadderExperienceGainMessage = clientApplication.eventLogStore.getMessages().at(-1);
  expect(expectedLadderExperienceGainMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
  expect(expectedLadderExperienceGainMessage?.message?.toString()).toBe(
    createLevelLadderExpRankMessage(
      character.entityProperties.name,
      ownerUsername,
      character.combatantProperties.classProgressionProperties.experiencePoints.getCurrent(),
      0
    )
  );
}

export function gotLadderDeathMessage(
  clientApplication: ClientApplication,
  ownerUsername: Username,
  character: Combatant
) {
  const expectedMessage = clientApplication.eventLogStore.getMessages().at(-1);
  expect(expectedMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
  expect(expectedMessage?.message?.toString()).toBe(
    createLadderDeathsMessage(
      character.entityProperties.name,
      ownerUsername,
      character.getLevel(),
      0
    )
  );
}
