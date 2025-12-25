import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent, CombatantClass, GameMode, GameName } from "@speed-dungeon/common";

export function quickStartGame() {
  const socketOption = websocketConnection;
  socketOption.emit(ClientToServerEvent.CreateGame, {
    gameName: "" as GameName,
    mode: GameMode.Race,
  });
  socketOption.emit(ClientToServerEvent.CreateParty, "");

  socketOption.emit(ClientToServerEvent.CreateCharacter, {
    name: "",
    combatantClass: CombatantClass.Rogue,
  });

  socketOption.emit(ClientToServerEvent.CreateCharacter, {
    name: "",
    combatantClass: CombatantClass.Warrior,
  });

  socketOption.emit(ClientToServerEvent.CreateCharacter, {
    name: "",
    combatantClass: CombatantClass.Mage,
  });
  socketOption.emit(ClientToServerEvent.ToggleReadyToStartGame);
  // socketOption?.emit(ClientToServerEvent.ToggleReadyToExplore);
  // socketOption?.emit(ClientToServerEvent.SelectCombatAction, "1", {
  //   type: CombatActionType.AbilityUsed,
  //   abilityName: AbilityName.Attack,
  // });
}

export function quickStartGameProgression() {
  const socketOption = websocketConnection;
  socketOption.emit(ClientToServerEvent.CreateGame, {
    gameName: "" as GameName,
    mode: GameMode.Progression,
  });

  socketOption.emit(ClientToServerEvent.ToggleReadyToStartGame);
  // socketOption?.emit(ClientToServerEvent.ToggleReadyToExplore);
  // socketOption?.emit(ClientToServerEvent.SelectCombatAction, "1", {
  //   type: CombatActionType.AbilityUsed,
  //   abilityName: AbilityName.Attack,
  // });
}
