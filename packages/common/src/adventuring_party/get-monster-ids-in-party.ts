import { AdventuringParty } from ".";

export default function getMonsterIdsInParty(party: AdventuringParty) {
  return Object.values(party.currentRoom.monsters).map((monster) => {
    return monster.entityProperties.id;
  });
}
