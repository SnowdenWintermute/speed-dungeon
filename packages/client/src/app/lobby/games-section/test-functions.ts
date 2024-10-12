import { ClientToServerEvent, CombatantClass } from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export function quickHost(socketOption: undefined | Socket) {
  socketOption?.emit(ClientToServerEvent.CreateGame, "test game");
  socketOption?.emit(ClientToServerEvent.CreateParty, "test party");
  socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Warrior);
}

export function quickJoin(socketOption: undefined | Socket) {
  socketOption?.emit(ClientToServerEvent.RequestsGameList);
  socketOption?.emit(ClientToServerEvent.JoinGame, "test game");
  socketOption?.emit(ClientToServerEvent.JoinParty, "test party");
  socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
  socketOption?.emit(ClientToServerEvent.ToggleReadyToStartGame);
}
