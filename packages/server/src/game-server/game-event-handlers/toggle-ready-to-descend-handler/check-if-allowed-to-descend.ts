import { AdventuringParty, DungeonRoomType, ERROR_MESSAGES } from "@speed-dungeon/common";

// it is in a separate file for jest ESM mocking. Couldn't get jest to mock it separately otherwise
export function checkIfAllowedToDescend(party: AdventuringParty): Error | undefined {
  if (Object.values(party.currentRoom.monsters).length > 0)
    return new Error(ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);

  if (party.currentRoom.roomType !== DungeonRoomType.Staircase)
    return new Error(ERROR_MESSAGES.PARTY.NOT_AT_STAIRCASE);

  return undefined;
}
