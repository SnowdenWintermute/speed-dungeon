import {
  CharacterAndItem,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { getGameServer } from "../../singletons.js";

export function craftItemHandler(
  eventData: CharacterAndItem,
  characterAssociatedData: CharacterAssociatedData,
  socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const gameServer = getGameServer();
  const { game, party, character, player } = characterAssociatedData;
  // deny if not in vending machine room
  // get price for crafting action
  // deny if not enough shards
  // perform action on item
  // save character
  // emit item
}

// CRAFTING MENU
// scour
// make item magical
// add affix
// reroll affixes
// reroll implicit item values (armor class)
// reroll affix values
//
// SEPARATE MENU
// repair
// convert to shards
