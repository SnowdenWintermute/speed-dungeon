import { DungeonRoom, DungeonRoomType } from "../adventuring_party/dungeon-room";
import { Battle } from "../battle";
import { CombatTurnResult } from "../combat";

export enum InPartyServerToClientEvent {
  PlayerToggledReadyToExplore = "0",
  DungeonRoomTypesOnCurrentFloor = "1",
  DungeonRoomUpdate = "2",
  BattleFullUpdate = "3",
  TurnResults = "4",
}

export interface InPartyServerToClientEventTypes {
  [InPartyServerToClientEvent.PlayerToggledReadyToExplore]: (characterId: string) => void;
  [InPartyServerToClientEvent.DungeonRoomTypesOnCurrentFloor]: (
    roomTypes: (DungeonRoomType | null)[]
  ) => void;
  [InPartyServerToClientEvent.DungeonRoomUpdate]: (dungeonRoom: DungeonRoom) => void;
  [InPartyServerToClientEvent.BattleFullUpdate]: (battle: Battle) => void;
  [InPartyServerToClientEvent.TurnResults]: (turnResults: CombatTurnResult[]) => void;
}
