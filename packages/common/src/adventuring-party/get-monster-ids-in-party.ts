import { AdventuringParty } from "./index.js";

export default function getMonsterIdsInParty(party: AdventuringParty) {
  return Object.values(party.currentRoom.monsters).map((monster) => {
    return monster.entityProperties.id;
  });
}
