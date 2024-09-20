import { AdventuringParty } from "./index.js";

export default function playerOwnsCharacter(
  party: AdventuringParty,
  username: string,
  characterId: string
) {
  const characterOption = party.characters[characterId];
  return characterOption !== undefined && characterOption.nameOfControllingUser === username;
}
