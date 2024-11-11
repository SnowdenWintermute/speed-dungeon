import { AdventuringParty } from "./index.js";
import { EntityId } from "../primatives/index.js";
import { removeFromArray } from "../utils/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";

export default function removeCharacterFromParty(
  party: AdventuringParty,
  characterId: EntityId,
  player: SpeedDungeonPlayer
) {
  removeFromArray(player.characterIds, characterId);
  delete party.characters[characterId];
  removeFromArray(party.characterPositions, characterId);
}
