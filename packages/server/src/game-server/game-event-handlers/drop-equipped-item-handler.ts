import {
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatantProperties,
  EquipmentSlot,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import writePlayerCharactersInGameToDb from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import errorHandler from "../error-handler.js";
import SocketIO from "socket.io";

export default function dropEquippedItemHandler(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  characterAssociatedData: CharacterAssociatedData,
  slot: EquipmentSlot
) {
  const { game, party, character, username } = characterAssociatedData;

  const itemDroppedIdResult = CombatantProperties.dropEquippedItem(
    party,
    character.combatantProperties,
    slot
  );
  if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

  const playerOption = game.players[username];
  if (playerOption && playerOption.partyName && game.mode === GameMode.Progression) {
    writePlayerCharactersInGameToDb(game, playerOption).then((maybeError) => {
      if (maybeError instanceof Error) return errorHandler(socket, maybeError.message);
    });
  }

  party.itemsOnGroundNotYetReceivedByAllClients[itemDroppedIdResult] = [];

  const partyChannelName = getPartyChannelName(game.name, party.name);
  this.io.to(partyChannelName).emit(ServerToClientEvent.CharacterDroppedEquippedItem, {
    characterId: character.entityProperties.id,
    slot,
  });
}
