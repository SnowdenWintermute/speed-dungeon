import {
  CharacterAssociatedData,
  ClientToServerEvent,
  Consumable,
  EntityId,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { websocketConnection } from "@/singletons/websocket-connection";
import { plainToInstance } from "class-transformer";

export function characterDroppedShardsHandler(eventData: {
  characterId: EntityId;
  shardStack: Consumable;
}) {
  const { characterId, shardStack } = eventData;
  websocketConnection.emit(
    ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
    shardStack.entityProperties.id
  );
  const asClassInstance = plainToInstance(Consumable, shardStack);

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    character.combatantProperties.inventory.changeShards(asClassInstance.usesRemaining * -1);

    party.currentRoom.inventory.insertItem(asClassInstance);
  });
}
