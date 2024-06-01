import { AdventuringParty, PlayerCharacter } from ".";
import { ERROR_MESSAGES } from "../errors";

export default function getCharacterIfOwned(
  party: AdventuringParty,
  playerCharacterIdsOption: null | string[],
  characterId: string
): Error | PlayerCharacter {
  if (!playerCharacterIdsOption) return new Error(ERROR_MESSAGES.PLAYER.NO_CHARACTERS);
  if (playerCharacterIdsOption.includes(characterId)) {
    const characterOption = party.characters[characterId] ?? null;
    if (characterOption) return characterOption;
  }
  return new Error(ERROR_MESSAGES.PLAYER.CHARACTER_NOT_OWNED);
}
