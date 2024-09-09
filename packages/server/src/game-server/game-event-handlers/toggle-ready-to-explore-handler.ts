import {
  AdventuringParty,
  BattleGroup,
  BattleGroupType,
  ERROR_MESSAGES,
  ServerToClientEvent,
  initateBattle,
  getPartyChannelName,
  updateCombatantHomePosition,
  PlayerAssociatedData,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { DungeonRoom, DungeonRoomType } from "@speed-dungeon/common";
import { tickCombatUntilNextCombatantIsActive } from "@speed-dungeon/common";
import { DescendOrExplore } from "@speed-dungeon/common";

export default function toggleReadyToExploreHandler(
  this: GameServer,
  playerAssociatedData: PlayerAssociatedData
): Error | void {
  const { game, party, username } = playerAssociatedData;

  if (Object.values(party.currentRoom.monsters).length > 0)
    return new Error(ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);

  AdventuringParty.updatePlayerReadiness(party, username, DescendOrExplore.Explore);

  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.PlayerToggledReadyToDescendOrExplore,
      username,
      DescendOrExplore.Explore
    );

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

  return this.exploreNextRoom(game, party);
}

export function exploreNextRoom(this: GameServer, game: SpeedDungeonGame, party: AdventuringParty) {
  party.playersReadyToExplore = [];

  if (party.unexploredRooms.length < 1) {
    console.log("generating room types");
    party.generateUnexploredRoomsQueue();
    // we only want the client to know about the monster lairs, they will discover other room types as they enter them
    const newRoomTypesListForClientOption: (DungeonRoomType | null)[] = party.unexploredRooms.map(
      (roomType) => {
        if (roomType === DungeonRoomType.MonsterLair) return roomType;
        else return null;
      }
    );

    this.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.DungeonRoomTypesOnCurrentFloor, newRoomTypesListForClientOption);
  }

  const roomTypeToGenerateOption = party.unexploredRooms.pop();
  if (roomTypeToGenerateOption === undefined) {
    console.error("no dungeon room to generate");
    return new Error(ERROR_MESSAGES.SERVER_GENERIC);
  }
  const roomTypeToGenerate: DungeonRoomType = roomTypeToGenerateOption;

  const newRoom = DungeonRoom.generate(game.idGenerator, party.currentFloor, roomTypeToGenerate);
  party.currentRoom = newRoom;

  for (const monster of Object.values(party.currentRoom.monsters))
    updateCombatantHomePosition(monster.entityProperties.id, monster.combatantProperties, party);

  party.roomsExplored.onCurrentFloor += 1;
  party.roomsExplored.total += 1;

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.DungeonRoomUpdate, party.currentRoom);

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
    party.battleId = battleIdResult;
    tickCombatUntilNextCombatantIsActive(game, battleIdResult);

    const battleOption = game.battles[party.battleId];
    if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    const battle = battleOption;
    this.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.BattleFullUpdate, battle);

    if (battle.turnTrackers[0] === undefined)
      return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
    const maybeError = this.takeAiControlledTurnIfActive(
      game,
      party,
      battle.turnTrackers[0].entityId
    );
    if (maybeError instanceof Error) return maybeError;
  }
}
