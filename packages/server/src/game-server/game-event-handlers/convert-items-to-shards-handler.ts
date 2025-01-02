import SocketIO from "socket.io";
import {
  CharacterAndItems,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatantEquipment,
  Inventory,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export function convertItemsToShardsHandler(
  characterAndItems: CharacterAndItems,
  characterAssociatedData: CharacterAssociatedData,
  _socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, party, character } = characterAssociatedData;
  const gameServer = getGameServer();
  const { itemIds } = characterAndItems;

  // find and convert it if owned (common code)

  // SERVER
  // save the character if in progression game
  // emit the message on this party's channel
}
