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
      this.clientApplication.alertsService.setAlert(error as Error);
      console.trace(error);
    }
  }

  resetConnection() {
    console.info("reconnecting to lobby");
    this.connectionTopology.resetLobbyConnection();
  }

  static QUICK_START_CHARACTER_CLASSES = [
    CombatantClass.Rogue,
    CombatantClass.Warrior,
    // CombatantClass.Warrior,
    // CombatantClass.Rogue,
    // CombatantClass.Mage,
  ];

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

    LobbyClient.QUICK_START_CHARACTER_CLASSES.forEach((combatantClass) => {
      this.dispatchIntent({
        type: ClientIntentType.CreateCharacter,
        data: {
          name: "" as EntityName,
          combatantClass,
        },
      });
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

  quickHost() {
    this.dispatchIntent({
      type: ClientIntentType.CreateGame,
      data: {
        gameName: "test game" as GameName,
        mode: GameMode.Race,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.CreateParty,
      data: {
        partyName: "test party" as PartyName,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.CreateCharacter,
      data: {
        name: "" as EntityName,
        combatantClass: CombatantClass.Rogue,
      },
    });
  }

  quickJoin() {
    this.dispatchIntent({
      type: ClientIntentType.JoinGame,
      data: {
        gameName: "test game" as GameName,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.JoinParty,
      data: {
        partyName: "test party" as PartyName,
      },
    });

    this.dispatchIntent({
      type: ClientIntentType.CreateCharacter,
      data: {
        name: "" as EntityName,
        combatantClass: CombatantClass.Warrior,
      },
    });
    this.dispatchIntent({
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    });
  }
}
