import { GameWorldView } from "@/game-world-view";
import { AppStore } from "@/mobx-stores/app-store";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { ClientIntent, ConnectionEndpoint, GameStateUpdate } from "@speed-dungeon/common";

export abstract class BaseClient {
  constructor(
    protected connectionEndpoint: ConnectionEndpoint,
    protected appStore: AppStore,
    protected gameWorldView: {
      current: null | GameWorldView;
    },
    protected characterAutoFocusManager: CharacterAutoFocusManager
  ) {
    this.registerListeners();
  }

  dispatchIntent(message: ClientIntent) {
    this.connectionEndpoint.send(JSON.stringify(message));
  }

  setEndpoint(connectionEndpoint: ConnectionEndpoint) {
    console.log("closing endpoint and setting new");
    this.connectionEndpoint.close();
    this.connectionEndpoint = connectionEndpoint;
  }

  protected registerListeners() {
    this.connectionEndpoint.on("open", () => {
      console.log("connected to lobby server");
    });

    this.connectionEndpoint.on("message", (untyped) => {
      console.log("untyped:", untyped);
      const typedMessage = this.getTypedMessage(untyped);
      this.handleMessage(typedMessage);
    });
  }

  protected abstract handleMessage(message: GameStateUpdate): void;

  protected getTypedMessage(rawData: string | ArrayBuffer) {
    const asString = rawData.toString();
    const asJson = JSON.parse(asString);
    const typedMessage = asJson as GameStateUpdate;
    return typedMessage;
  }
}
