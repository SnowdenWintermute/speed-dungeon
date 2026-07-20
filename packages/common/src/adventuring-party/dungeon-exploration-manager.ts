import { makeAutoObservable } from "mobx";
import { GAME_CONFIG } from "../app-consts.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { DungeonRoomType } from "./dungeon-room.js";
import { AdventuringParty } from "./index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { Milliseconds } from "../aliases.js";
import type { MonsterSpawnEntry } from "../dungeon-generation/monster-types-by-floor.js";
import type { MonsterType } from "../monsters/monster-types.js";

export class DungeonExplorationManager implements Serializable, ReactiveNode {
  private currentFloor: number = 1;
  private livePlayTimeAtCurrentFloorEnteredMs: Milliseconds = 0;
  private roomsExplored: RoomsExploredTracker = { total: 0, onCurrentFloor: 0 };
  private unexploredRooms: DungeonRoomType[] = [];
  private clientCurrentFloorRoomsList: (null | DungeonRoomType)[] = [];
  private currentFloorPalette: MonsterSpawnEntry[] = [];
  private currentFloorBoss: MonsterType | null = null;
  private playerExplorationActionChoices: Record<ExplorationAction, string[]> = {
    [ExplorationAction.Descend]: [],
    [ExplorationAction.Explore]: [],
  };

  makeObservable(): void {
    makeAutoObservable(this);
  }

  toSerialized() {
    return {
      currentFloor: this.currentFloor,
      livePlayTimeAtCurrentFloorEnteredMs: this.livePlayTimeAtCurrentFloorEnteredMs,
      roomsExplored: { ...this.roomsExplored },
      unexploredRooms: [...this.unexploredRooms],
      clientCurrentFloorRoomsList: [...this.clientCurrentFloorRoomsList],
      currentFloorPalette: this.currentFloorPalette.map((entry) => ({ ...entry })),
      currentFloorBoss: this.currentFloorBoss,
      playerExplorationActionChoices: {
        [ExplorationAction.Explore]: [
          ...this.playerExplorationActionChoices[ExplorationAction.Explore],
        ],
        [ExplorationAction.Descend]: [
          ...this.playerExplorationActionChoices[ExplorationAction.Descend],
        ],
      },
    };
  }

  toSerializedForClient(): SerializedOf<DungeonExplorationManager> {
    return {
      ...this.toSerialized(),
      unexploredRooms: [],
      currentFloorPalette: [],
      currentFloorBoss: null,
    };
  }

  static fromSerialized(serialized: SerializedOf<DungeonExplorationManager>) {
    const result = new DungeonExplorationManager();
    result.currentFloor = serialized.currentFloor;
    result.livePlayTimeAtCurrentFloorEnteredMs = serialized.livePlayTimeAtCurrentFloorEnteredMs;
    result.roomsExplored = { ...serialized.roomsExplored };
    result.unexploredRooms = [...serialized.unexploredRooms];
    result.clientCurrentFloorRoomsList = [...serialized.clientCurrentFloorRoomsList];
    result.currentFloorPalette = serialized.currentFloorPalette.map((entry) => ({ ...entry }));
    result.currentFloorBoss = serialized.currentFloorBoss;
    result.playerExplorationActionChoices = {
      [ExplorationAction.Explore]: [
        ...serialized.playerExplorationActionChoices[ExplorationAction.Explore],
      ],
      [ExplorationAction.Descend]: [
        ...serialized.playerExplorationActionChoices[ExplorationAction.Descend],
      ],
    };
    return result;
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
      if (playerIsNotReady) {
        return false;
      }
    }
    return true;
  }

  clearPlayerExplorationActionChoices() {
    this.playerExplorationActionChoices[ExplorationAction.Descend].length = 0;
    this.playerExplorationActionChoices[ExplorationAction.Explore].length = 0;
  }

  getPlayersChoosingAction(action: ExplorationAction) {
    return this.playerExplorationActionChoices[action];
  }

  setUnexploredRoomTypes(value: DungeonRoomType[]) {
    this.unexploredRooms.length = 0;
    this.unexploredRooms.push(...value);
  }

  /** The client only learns about combat rooms up front (so it can show a boss is coming). Other
   * room types stay hidden until entered. */
  getFilteredNewRoomListForClient() {
    const newRoomTypesListForClientOption: (DungeonRoomType | null)[] = this.unexploredRooms.map(
      (roomType) => {
        if (roomType === DungeonRoomType.MonsterLair || roomType === DungeonRoomType.BossLair) {
          return roomType;
        } else {
          return null;
        }
      }
    );

    newRoomTypesListForClientOption.reverse();
    return newRoomTypesListForClientOption;
  }

  getCurrentFloorPalette() {
    return this.currentFloorPalette;
  }

  setCurrentFloorPalette(palette: MonsterSpawnEntry[]) {
    this.currentFloorPalette = palette;
  }

  getCurrentFloorBoss() {
    return this.currentFloorBoss;
  }

  setCurrentFloorBoss(boss: MonsterType | null) {
    this.currentFloorBoss = boss;
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

  markCurrentFloorEnteredTimestamp(clockLivePlayTimeMs: Milliseconds) {
    this.livePlayTimeAtCurrentFloorEnteredMs = clockLivePlayTimeMs;
  }

  getTimeSpentOnCurrentFloor(clockLivePlayTimeMs: Milliseconds): Milliseconds {
    return clockLivePlayTimeMs - this.livePlayTimeAtCurrentFloorEnteredMs;
  }

  partyEscapedDungeon() {
    return this.currentFloor === GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE;
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

  revealRoom(indexOfRoomTypeToReveal: number, roomType: DungeonRoomType) {
    this.clientCurrentFloorRoomsList[indexOfRoomTypeToReveal] = roomType;
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
