import {
  AdventuringParty,
  BattleGroup,
  BattleGroupType,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
  updateCombatantHomePosition,
  SpeedDungeonGame,
  Battle,
  CombatantTurnTracker,
  GameMode,
  InputLock,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { DungeonRoomType } from "@speed-dungeon/common";
import { tickCombatUntilNextCombatantIsActive } from "@speed-dungeon/common";
import { DescendOrExplore } from "@speed-dungeon/common";
import { idGenerator, getGameServer } from "../../singletons.js";
import { generateDungeonRoom } from "../dungeon-room-generation/index.js";
import { writeAllPlayerCharacterInGameToDb } from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { processBattleUntilPlayerTurnOrConclusion } from "./character-uses-selected-combat-action-handler/process-battle-until-player-turn-or-conclusion.js";

export async function toggleReadyToExploreHandler(
  _eventData: undefined,
  data: ServerPlayerAssociatedData
): Promise<Error | void> {
  const { game, partyOption, player } = data;
  const { username } = player;
  const gameServer = getGameServer();
  if (partyOption === undefined) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = partyOption;

  if (InputLock.isLocked(party.inputLock)) {
    console.error("input is locked");
    throw new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);
  }

  if (Object.values(party.currentRoom.monsters).length > 0)
    return new Error(ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);

  AdventuringParty.updatePlayerReadiness(party, username, DescendOrExplore.Explore);

  gameServer.io
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

  return gameServer.exploreNextRoom(game, party);
}

export async function exploreNextRoom(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
) {
  if (game.mode === GameMode.Progression) writeAllPlayerCharacterInGameToDb(this, game);

  party.playersReadyToExplore = [];

  if (party.unexploredRooms.length < 1) {
    party.generateUnexploredRoomsQueue();
    // we only want the client to know about the monster lairs, they will discover other room types as they enter them
    const newRoomTypesListForClientOption: (DungeonRoomType | null)[] = party.unexploredRooms.map(
      (roomType) => {
        if (roomType === DungeonRoomType.MonsterLair) return roomType;
        else return null;
      }
    );

    newRoomTypesListForClientOption.reverse();

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

  putPartyInNextRoom(game, party, roomTypeToGenerate);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.DungeonRoomUpdate, party.currentRoom);

  if (party.battleId === null) return;

  const battleOption = game.battles[party.battleId];
  if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
  const battle = battleOption;
  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.BattleFullUpdate, battle);

  if (battle.turnTrackers[0] === undefined)
    return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

  const battleProcessingPayloadsResult = await processBattleUntilPlayerTurnOrConclusion(
    this,
    game,
    party,
    battleOption
  );
  if (battleProcessingPayloadsResult instanceof Error) return battleProcessingPayloadsResult;
}

export function putPartyInNextRoom(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  roomTypeToGenerate: DungeonRoomType
) {
  const newRoom = generateDungeonRoom(party.currentFloor, roomTypeToGenerate);
  console.log("generated room");
  party.currentRoom = newRoom;

  for (const monster of Object.values(party.currentRoom.monsters))
    updateCombatantHomePosition(monster.entityProperties.id, monster.combatantProperties, party);

  party.roomsExplored.onCurrentFloor += 1;
  party.roomsExplored.total += 1;

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
      party.currentRoom.monsterPositions,
      BattleGroupType.ComputerControlled
    );

    const battleIdResult = initiateBattle(game, battleGroupA, battleGroupB);
    if (battleIdResult instanceof Error) return battleIdResult;
    party.battleId = battleIdResult;
    tickCombatUntilNextCombatantIsActive(game, battleIdResult);
  }
}

function initiateBattle(
  game: SpeedDungeonGame,
  groupA: BattleGroup,
  groupB: BattleGroup
): Error | string {
  const turnTrackersResult = createCombatTurnTrackers(game, groupA, groupB);
  if (turnTrackersResult instanceof Error) return turnTrackersResult;
  const battle = new Battle(idGenerator.generate(), groupA, groupB, turnTrackersResult);
  game.battles[battle.id] = battle;
  return battle.id;
}

function createCombatTurnTrackers(
  game: SpeedDungeonGame,
  battleGroupA: BattleGroup,
  battleGroupB: BattleGroup
): Error | CombatantTurnTracker[] {
  let currTieBreakingIndexCounter = { currTieBreakingIndex: 0 };
  const groupATrackersResult = createTrackersForBattleGroupCombatants(
    game,
    battleGroupA,
    currTieBreakingIndexCounter
  );
  if (groupATrackersResult instanceof Error) return groupATrackersResult;
  const groupBTrackersResult = createTrackersForBattleGroupCombatants(
    game,
    battleGroupB,
    currTieBreakingIndexCounter
  );
  if (groupBTrackersResult instanceof Error) return groupBTrackersResult;

  return groupATrackersResult.concat(groupBTrackersResult);
}

function createTrackersForBattleGroupCombatants(
  game: SpeedDungeonGame,
  battleGroup: BattleGroup,
  currTieBreakingIndexCounter: { currTieBreakingIndex: number }
): Error | CombatantTurnTracker[] {
  const trackers: CombatantTurnTracker[] = [];
  for (const entityId of battleGroup.combatantIds) {
    const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
    if (combatantResult instanceof Error) return combatantResult;
    const combatant = combatantResult;
    if (combatant.combatantProperties.hitPoints > 0) {
      trackers.push(
        new CombatantTurnTracker(entityId, currTieBreakingIndexCounter.currTieBreakingIndex)
      );
    }
    currTieBreakingIndexCounter.currTieBreakingIndex += 1;
  }
  return trackers;
}
