import {
  AdventuringParty,
  BattleGroup,
  BattleGroupType,
  ERROR_MESSAGES,
  InPartyClientToServerEventTypes,
  InPartyServerToClientEvent,
  InPartyServerToClientEventTypes,
  SocketNamespaces,
  getPlayerParty,
  initateBattle,
  removeFromArray,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import errorHandler from "../error-handler";
import { DungeonRoom, DungeonRoomType } from "@speed-dungeon/common";

export default function toggleReadyToExploreHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection<
    InPartyClientToServerEventTypes,
    InPartyServerToClientEventTypes
  >(socketId, SocketNamespaces.Party);
  if (!socket) return console.error("No socket found");

  const { username } = socketMeta;

  const gameResult = this.getSocketCurrentGame(socketMeta);
  if (gameResult instanceof Error) return errorHandler(socket, gameResult.message);
  const game = gameResult;
  const partyResult = getPlayerParty(gameResult, socketMeta.username);
  if (partyResult instanceof Error) return errorHandler(socket, partyResult.message);
  const party = partyResult;
  if (Object.values(party.currentRoom.monsters).length > 0)
    return errorHandler(socket, ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);

  // can't be trying to explore and descend at the same time
  if (party.playersReadyToDescend.includes(username))
    removeFromArray(party.playersReadyToDescend, username);

  if (party.playersReadyToExplore.includes(username))
    removeFromArray(party.playersReadyToExplore, username);
  else party.playersReadyToExplore.push(username);

  socket.emit(InPartyServerToClientEvent.PlayerToggledReadyToExplore, username);

  // if all players names are in the ready to explore list, generate the next room and remove
  // them all from the ready list
  let allPlayersReadyToExplore = true;
  for (const username of party.playerUsernames) {
    if (!party.playersReadyToExplore.includes(username)) {
      allPlayersReadyToExplore = false;
      break;
    }
  }

  if (!allPlayersReadyToExplore) return;

  party.playersReadyToExplore = [];
  if (party.unexploredRooms.length < 1) {
    party.generateUnexploredRoomsQueue();
    // we only want the client to know about the monster lairs, they will discover other room types as they enter them
    const newRoomTypesListForClientOption = party.unexploredRooms.map((roomType) => {
      if (roomType === DungeonRoomType.MonsterLair) return roomType;
      else return null;
    });
    socket.emit(
      InPartyServerToClientEvent.DungeonRoomTypesOnCurrentFloor,
      newRoomTypesListForClientOption
    );
  }
  const roomTypeToGenerateOption = party.unexploredRooms.pop();
  if (!roomTypeToGenerateOption) {
    console.error("no dungeon room to generate");
    return errorHandler(socket, ERROR_MESSAGES.SERVER_GENERIC);
  }
  const roomTypeToGenerate: DungeonRoomType = roomTypeToGenerateOption;

  const newRoom = DungeonRoom.generate(game.idGenerator, party.currentFloor, roomTypeToGenerate);
  party.currentRoom = newRoom;
  party.roomsExplored.onCurrentFloor += 1;
  party.roomsExplored.total += 1;

  socket.emit(InPartyServerToClientEvent.DungeonRoomUpdate, newRoom);

  if (Object.keys(newRoom.monsters).length > 0) {
    const battleGroupA = new BattleGroup(
      party.name,
      party.name,
      party.characterPositions,
      BattleGroupType.PlayerControlled
    );
    const battleGroupB = new BattleGroup(
      `${party.name}-monsters`,
      party.name,
      AdventuringParty.getMonsterIds(party),
      BattleGroupType.ComputerControlled
    );

    const battleIdResult = initateBattle(game, battleGroupA, battleGroupB);
    if (battleIdResult instanceof Error) return battleIdResult;
    // tick until next active turn
  }
}
