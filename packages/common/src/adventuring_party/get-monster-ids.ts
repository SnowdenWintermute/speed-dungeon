import { AdventuringParty } from ".";

export default function getMonsterIdsInParty(this: AdventuringParty) {
  return Object.values(this.currentRoom.monsters).map((monster) => {
    return monster.entityProperties.id;
  });
}
