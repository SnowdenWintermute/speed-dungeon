import { ClientToServerEvent, CombatantClass, GameMode } from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export function quickHost(socketOption: undefined | Socket) {
  socketOption?.emit(ClientToServerEvent.CreateGame, {
    gameName: "test game",
    mode: GameMode.Race,
  });
  socketOption?.emit(ClientToServerEvent.CreateParty, "test party");
  socketOption?.emit(ClientToServerEvent.CreateCharacter, {
    name: "",
    combatantClass: CombatantClass.Warrior,
  });
}

export function quickJoin(socketOption: undefined | Socket) {
  socketOption?.emit(ClientToServerEvent.RequestsGameList);
  socketOption?.emit(ClientToServerEvent.JoinGame, "test game");
  socketOption?.emit(ClientToServerEvent.JoinParty, "test party");
  socketOption?.emit(ClientToServerEvent.CreateCharacter, {
    name: "",
    combatantClass: CombatantClass.Mage,
  });
  socketOption?.emit(ClientToServerEvent.ToggleReadyToStartGame);
}
