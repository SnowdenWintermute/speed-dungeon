import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, Item } from "@speed-dungeon/common";

export function postItemLink(item: Item) {
  websocketConnection.emit(ClientToServerEvent.PostItemLink, item.entityProperties.id);
}
