import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { DungeonRoom, ERROR_MESSAGES, updateCombatantHomePosition } from "@speed-dungeon/common";

export default function newDungeonRoomHandler(room: DungeonRoom) {
  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

    party.playersReadyToDescend = [];
    party.playersReadyToExplore = [];
    party.currentRoom = room;

    for (const monster of Object.values(party.currentRoom.monsters))
      updateCombatantHomePosition(monster.entityProperties.id, monster.combatantProperties, party);
    party.roomsExplored.onCurrentFloor += 1;
    party.roomsExplored.total += 1;
    const indexOfRoomTypeToReveal = party.roomsExplored.onCurrentFloor - 1;
    party.clientCurrentFloorRoomsList[indexOfRoomTypeToReveal] = room.roomType;

    if (room.monsterPositions.length) gameState.baseMenuState.inCombat = true;
  });
}
