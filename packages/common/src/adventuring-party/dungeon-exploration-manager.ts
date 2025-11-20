import { makeAutoObservable } from "mobx";
import { EMPTY_ROOMS_PER_FLOOR, GAME_CONFIG } from "../app-consts.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../utils/index.js";
import { DungeonRoomType } from "./dungeon-room.js";
import { AdventuringParty } from "./index.js";
import { plainToInstance } from "class-transformer";

export class DungeonExplorationManager {
  private currentFloor: number = 1;
  private roomsExplored: RoomsExploredTracker = { total: 0, onCurrentFloor: 1 };
  private unexploredRooms: DungeonRoomType[] = [];
  private clientCurrentFloorRoomsList: (null | DungeonRoomType)[] = [];
  private playerExplorationActionChoices: Record<ExplorationAction, string[]> = {
    [ExplorationAction.Descend]: [],
    [ExplorationAction.Explore]: [],
  };

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(plain: DungeonExplorationManager) {
    return plainToInstance(DungeonExplorationManager, plain);
  }

  unexploredRoomsExistOnCurrentFloor() {
    return this.unexploredRooms.length > 0;
  }

  updatePlayerExplorationActionChoice(username: string, choice: ExplorationAction) {
    for (const [action, playerList] of iterateNumericEnumKeyedRecord(
      this.playerExplorationActionChoices
    )) {
      const playerWantsDifferentAction = action !== choice;
      const playerAlreadyWasChoosingThisAction = playerList.includes(username);

      if (playerWantsDifferentAction || playerAlreadyWasChoosingThisAction) {
        ArrayUtils.removeElement(playerList, username);
      } else {
        playerList.push(username);
      }
    }
  }

  allPlayersReadyToTakeAction(action: ExplorationAction, party: AdventuringParty) {
    const playersReadyToTakeAction = this.playerExplorationActionChoices[action];
    for (const username of party.playerUsernames) {
      const playerIsNotReady = !playersReadyToTakeAction.includes(username);
      if (playerIsNotReady) return false;
    }
    return true;
  }

  clearPlayerExplorationActionChoices() {
    this.playerExplorationActionChoices = {
      [ExplorationAction.Descend]: [],
      [ExplorationAction.Explore]: [],
    };
  }

  getPlayersChoosingAction(action: ExplorationAction) {
    return this.playerExplorationActionChoices[action];
  }

  generateUnexploredRoomsQueue() {
    for (let i = 0; i < GAME_CONFIG.MONSTER_LAIRS_PER_FLOOR; i += 1) {
      this.unexploredRooms.push(DungeonRoomType.MonsterLair);
    }
    for (let i = 0; i < EMPTY_ROOMS_PER_FLOOR; i += 1) {
      this.unexploredRooms.push(DungeonRoomType.Empty);
    }

    ArrayUtils.shuffle(this.unexploredRooms);

    if (this.currentFloor === 1 && this.roomsExplored.total === 0) {
      this.unexploredRooms.push(DungeonRoomType.Empty);
    }
    this.unexploredRooms.push(DungeonRoomType.VendingMachine); // TESTING

    this.unexploredRooms.unshift(DungeonRoomType.VendingMachine);
    this.unexploredRooms.unshift(DungeonRoomType.Staircase);
  }

  /** We only want the client to know about the monster lairs. They will discover other room types as they enter them. */
  getFilteredNewRoomListForClient() {
    const newRoomTypesListForClientOption: (DungeonRoomType | null)[] = this.unexploredRooms.map(
      (roomType) => {
        if (roomType === DungeonRoomType.MonsterLair) return roomType;
        else return null;
      }
    );

    newRoomTypesListForClientOption.reverse();
    return newRoomTypesListForClientOption;
  }

  popNextUnexploredRoomType() {
    const roomTypeToGenerateOption = this.unexploredRooms.pop();
    if (roomTypeToGenerateOption === undefined) {
      console.error("no dungeon room to generate");
      throw new Error(ERROR_MESSAGES.SERVER_GENERIC);
    }
    return roomTypeToGenerateOption;
  }

  clearUnexploredRooms() {
    this.unexploredRooms = [];
  }

  incrementExploredRoomsTrackers() {
    this.roomsExplored.total += 1;
    this.roomsExplored.onCurrentFloor += 1;
  }

  incrementCurrentFloor() {
    this.currentFloor += 1;
  }

  setCurrentFloor(newFloorNumber: number) {
    this.currentFloor = newFloorNumber;
  }

  getCurrentFloor() {
    return this.currentFloor;
  }

  getCurrentRoomNumber() {
    return this.roomsExplored.onCurrentFloor;
  }

  clearRoomsExploredOnCurrentFloorCount() {
    this.roomsExplored.onCurrentFloor = 0;
  }

  getClientVisibleRoomExplorationList() {
    return this.clientCurrentFloorRoomsList;
  }

  setClientVisibleRoomExplorationList(newList: (DungeonRoomType | null)[]) {
    this.clientCurrentFloorRoomsList = newList;
  }
}

export enum ExplorationAction {
  Explore,
  Descend,
}

export interface RoomsExploredTracker {
  total: number;
  onCurrentFloor: number;
}
