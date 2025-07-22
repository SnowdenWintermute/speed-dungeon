import { ClientToServerEvent, CombatantClass, GameMode } from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export function quickStartGame(socketOption: Socket | undefined) {
  socketOption?.emit(ClientToServerEvent.CreateGame, { gameName: "", mode: GameMode.Race });
  socketOption?.emit(ClientToServerEvent.CreateParty, "");
  // socketOption?.emit(ClientToServerEvent.CreateCharacter, {
  //   name: "",
  //   combatantClass: CombatantClass.Rogue,
  // });
  // socketOption?.emit(ClientToServerEvent.CreateCharacter, {
  //   name: "",
  //   combatantClass: CombatantClass.Warrior,
  // });
  socketOption?.emit(ClientToServerEvent.CreateCharacter, {
    name: "",
    combatantClass: CombatantClass.Warrior,
  });
  // socketOption?.emit(ClientToServerEvent.CreateCharacter, {
  //   name: "",
  //   combatantClass: CombatantClass.Warrior,
  // });
  socketOption?.emit(ClientToServerEvent.ToggleReadyToStartGame);
  // socketOption?.emit(ClientToServerEvent.ToggleReadyToExplore);
  // socketOption?.emit(ClientToServerEvent.SelectCombatAction, "1", {
  //   type: CombatActionType.AbilityUsed,
  //   abilityName: AbilityName.Attack,
  // });
}
