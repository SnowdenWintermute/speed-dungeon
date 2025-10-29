import {
  AdventuringParty,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
  SpeedDungeonGame,
  Battle,
  GameMode,
  InputLock,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { DungeonRoomType } from "@speed-dungeon/common";
import { idGenerator, getGameServer } from "../../singletons/index.js";
import { generateDungeonRoom } from "../dungeon-room-generation/index.js";
import { writeAllPlayerCharacterInGameToDb } from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { BattleProcessor } from "./character-uses-selected-combat-action-handler/process-battle-until-player-turn-or-conclusion.js";
import { ExplorationAction } from "@speed-dungeon/common";

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

  if (party.combatantManager.monstersArePresent()) {
    return new Error(ERROR_MESSAGES.PARTY.CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT);
  }

  const { dungeonExplorationManager } = party;
  dungeonExplorationManager.updatePlayerExplorationActionChoice(
    username,
    ExplorationAction.Explore
  );

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.PlayerToggledReadyToDescendOrExplore,
      username,
      ExplorationAction.Explore
    );

  const allPlayersReadyToExplore = dungeonExplorationManager.allPlayersReadyToTakeAction(
    ExplorationAction.Explore,
    party
  );

  const waitingForPlayersToBeReady = !allPlayersReadyToExplore;

  if (waitingForPlayersToBeReady) return;

  return gameServer.exploreNextRoom(game, party);
}

export async function exploreNextRoom(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
) {
  if (game.mode === GameMode.Progression) writeAllPlayerCharacterInGameToDb(this, game);

  const { dungeonExplorationManager } = party;

  dungeonExplorationManager.clearPlayerExplorationActionChoices();

  const noUnexploredRoomsRemain = !dungeonExplorationManager.unexploredRoomsExistOnCurrentFloor();

  if (noUnexploredRoomsRemain) {
    dungeonExplorationManager.generateUnexploredRoomsQueue();

    const newRoomTypesListForClient = dungeonExplorationManager.getFilteredNewRoomListForClient();

    this.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.DungeonRoomTypesOnCurrentFloor, newRoomTypesListForClient);
  }

  const roomTypeToGenerate = dungeonExplorationManager.popNextUnexploredRoomType();

  const { actionEntityManager } = party;
  const actionEntitiesRemoved = actionEntityManager.unregisterActionEntitiesOnBattleEndOrNewRoom();

  const newMonstersResult = putPartyInNextRoom(game, party, roomTypeToGenerate);
  if (newMonstersResult instanceof Error) return newMonstersResult;
  const serializedMonsters = newMonstersResult.map((combatant) => combatant.getSerialized());

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.DungeonRoomUpdate, {
    dungeonRoom: party.currentRoom,
    monsters: serializedMonsters,
    actionEntitiesToRemove: actionEntitiesRemoved,
  });

  const battleOption = AdventuringParty.getBattleOption(party, game);
  if (battleOption === null) return;

  const battle = battleOption;
  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.BattleFullUpdate, battle);

  const battleProcessor = new BattleProcessor(this, game, party, battleOption);
  const maybeError = await battleProcessor.processBattleUntilPlayerTurnOrConclusion();
  if (maybeError instanceof Error) return maybeError;
}

export function putPartyInNextRoom(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  roomTypeToGenerate: DungeonRoomType
) {
  const { dungeonExplorationManager } = party;
  const floorNumber = dungeonExplorationManager.getCurrentFloor();

  const { room, monsters } = generateDungeonRoom(floorNumber, roomTypeToGenerate);
  party.setCurrentRoom(room);

  for (const monster of monsters) {
    party.combatantManager.addCombatant(monster);
  }

  party.combatantManager.updateHomePositions();

  dungeonExplorationManager.incrementExploredRoomsTrackers();

  if (party.combatantManager.monstersArePresent()) {
    const battleIdResult = initiateBattle(game, party);
    if (battleIdResult instanceof Error) return battleIdResult;
    party.battleId = battleIdResult;
  }

  return monsters;
}

function initiateBattle(game: SpeedDungeonGame, party: AdventuringParty): Error | string {
  const battle = new Battle(idGenerator.generate(), game, party);
  game.battles[battle.id] = battle;
  battle.turnOrderManager.updateTrackers(game, party);
  return battle.id;
}
