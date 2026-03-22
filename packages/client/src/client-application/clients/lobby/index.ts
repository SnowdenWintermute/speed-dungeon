import {
  ClientIntentType,
  CombatantClass,
  EntityName,
  GameMode,
  GameName,
  GameStateUpdate,
  PartyName,
  invariant,
} from "@speed-dungeon/common";
import { createLobbyUpdateHandlers } from "./update-handlers";
import { BaseClient } from "../base";
import { setAlert } from "@/app/components/alerts";

export class LobbyClient extends BaseClient {
  private updateHandlers = createLobbyUpdateHandlers(
    this.clientApplication,
    this.connectionEndpoint
  );

  protected handleMessage(message: GameStateUpdate) {
    const handlerOption = this.updateHandlers[message.type];
    invariant(handlerOption !== undefined, `Unhandled update type: ${JSON.stringify(message)}`);
    try {
      handlerOption(message.data as never);
    } catch (error) {
      setAlert(error as Error);
      console.trace(error);
    }
  }

  resetConnection() {
    console.info("reconnecting to lobby");
    this.connectionTopology.resetLobbyConnection();
  }

  quickStartGame() {
    this.dispatchIntent({
      type: ClientIntentType.CreateGame,
      data: {
        gameName: "" as GameName,
        mode: GameMode.Race,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.CreateParty,
      data: {
        partyName: "" as PartyName,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.CreateCharacter,
      data: {
        name: "" as EntityName,
        combatantClass: CombatantClass.Rogue,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    });
  }

  quickStartGameProgression() {
    this.dispatchIntent({
      type: ClientIntentType.CreateGame,
      data: {
        gameName: "" as GameName,
        mode: GameMode.Progression,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    });
  }
}
