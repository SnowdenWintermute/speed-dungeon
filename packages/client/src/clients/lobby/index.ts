import { ConnectionEndpoint, GameStateUpdate, invariant } from "@speed-dungeon/common";
import { createLobbyUpdateHandlers } from "./lobby-update-handlers";
import { AppStore } from "@/mobx-stores/app-store";
import { GameWorldView } from "@/game-world-view";

export class LobbyClient {
  private updateHandlers = createLobbyUpdateHandlers(this.appStore, this.gameWorldView);

  constructor(
    private connectionEndpoint: ConnectionEndpoint,
    private appStore: AppStore,
    private gameWorldView: {
      current: null | GameWorldView;
    }
  ) {
    this.registerListeners();
  }

  private registerListeners() {
    this.connectionEndpoint.on("open", () => {
      console.log("connected to lobby server");
    });

    this.connectionEndpoint.on("message", (untyped) => {
      const typedMessage = this.getTypedMessage(untyped);
      this.handleMessage(typedMessage);
    });
  }

  private handleMessage(message: GameStateUpdate) {
    const handlerOption = this.updateHandlers[message.type];
    invariant(handlerOption !== undefined, "Unhandled update type");
    handlerOption(message.data as never);
  }

  private getTypedMessage(rawData: string | ArrayBuffer) {
    const asString = rawData.toString();
    const asJson = JSON.parse(asString);
    const typedMessage = asJson as GameStateUpdate;
    return typedMessage;
  }
}
