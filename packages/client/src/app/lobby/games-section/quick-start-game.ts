import { lobbyClientSingleton } from "@/singletons/lobby-client";
import {
  ClientIntentType,
  CombatantClass,
  EntityName,
  GameMode,
  GameName,
  PartyName,
} from "@speed-dungeon/common";

export function quickStartGame() {
  const lobbyClient = lobbyClientSingleton.get();
  lobbyClient.dispatchIntent({
    type: ClientIntentType.CreateGame,
    data: {
      gameName: "" as GameName,
      mode: GameMode.Race,
    },
  });

  lobbyClient.dispatchIntent({
    type: ClientIntentType.CreateParty,
    data: {
      partyName: "" as PartyName,
    },
  });

  lobbyClient.dispatchIntent({
    type: ClientIntentType.CreateCharacter,
    data: {
      name: "" as EntityName,
      combatantClass: CombatantClass.Rogue,
    },
  });

  lobbyClient.dispatchIntent({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });
}

export function quickStartGameProgression() {
  const lobbyClient = lobbyClientSingleton.get();
  lobbyClient.dispatchIntent({
    type: ClientIntentType.CreateGame,
    data: {
      gameName: "" as GameName,
      mode: GameMode.Progression,
    },
  });

  lobbyClient.dispatchIntent({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });
}
