import { ClientToServerEvent, CombatantClass } from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function quickStartGame(socketOption: Socket | undefined) {
  socketOption?.emit(ClientToServerEvent.CreateGame, "");
  socketOption?.emit(ClientToServerEvent.CreateParty, "");
  socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Warrior);
  socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Rogue);
  socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
  socketOption?.emit(ClientToServerEvent.ToggleReadyToStartGame);
  // socketOption?.emit(ClientToServerEvent.ToggleReadyToExplore);
  // socketOption?.emit(ClientToServerEvent.SelectCombatAction, "1", {
  //   type: CombatActionType.AbilityUsed,
  //   abilityName: CombatantAbilityName.Attack,
  // });
}
