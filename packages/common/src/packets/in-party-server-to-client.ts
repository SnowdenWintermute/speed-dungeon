import { DungeonRoom, DungeonRoomType } from "../adventuring_party/dungeon-room";

export enum InPartyServerToClientEvent {
  PlayerToggledReadyToExplore = "0",
  DungeonRoomTypesOnCurrentFloor = "1",
  DungeonRoomUpdate = "2",
}

export interface InPartyServerToClientEventTypes {
  [InPartyServerToClientEvent.PlayerToggledReadyToExplore]: (characterId: string) => void;
  [InPartyServerToClientEvent.DungeonRoomTypesOnCurrentFloor]: (
    roomTypes: (DungeonRoomType | null)[]
  ) => void;
  [InPartyServerToClientEvent.DungeonRoomUpdate]: (dungeonRoom: DungeonRoom) => void;
}
