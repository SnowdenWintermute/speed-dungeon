import SocketIO from "socket.io";
import {
  CONSUMABLE_TYPE_STRINGS,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  Consumable,
  ConsumableType,
  ERROR_MESSAGES,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer, idGenerator } from "../../singletons/index.js";
import { writePlayerCharactersInGameToDb } from "../saved-character-event-handlers/write-player-characters-in-game-to-db.js";

export async function dropShardsHandler(
  eventData: { characterId: string; numShards: number },
  characterAssociatedData: CharacterAssociatedData,
  _socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, party, character, player } = characterAssociatedData;
  const gameServer = getGameServer();
  const { characterId, numShards } = eventData;
  const { inventory } = character.combatantProperties;

  if (typeof numShards !== "number") return new Error("Wrong data type");
  // check if have enough shards
  if (inventory.shards < numShards) return new Error(ERROR_MESSAGES.COMBATANT.NOT_ENOUGH_SHARDS);
  // deduct shards from inventory
  inventory.shards -= numShards;
  // create a "shard stack" consumable item
  const shardStack = createShardStack(numShards);
  party.currentRoom.inventory.insertItem(shardStack);
  party.itemsOnGroundNotYetReceivedByAllClients[shardStack.entityProperties.id] = [];

  // SERVER
  // save the character if in progression game
  if (game.mode === GameMode.Progression) {
    const writeResult = await writePlayerCharactersInGameToDb(game, player);
    if (writeResult instanceof Error) return writeResult;
  }
  // emit the message on this party's channel
  gameServer.io
    .to(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterDroppedShards, { characterId, shardStack });
}

function createShardStack(numShards: number) {
  const name = `${CONSUMABLE_TYPE_STRINGS[ConsumableType.StackOfShards]} (${numShards})`;
  return new Consumable(
    {
      name,
      id: idGenerator.generate(),
    },
    0,
    {},
    ConsumableType.StackOfShards,
    numShards
  );
}
