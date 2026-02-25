import { ConnectionEndpoint, GameStateUpdate, invariant } from "@speed-dungeon/common";
import { createLobbyUpdateHandlers } from "./lobby-update-handlers";

export class LobbyClient {
  private updateHandlers = createLobbyUpdateHandlers();
  constructor(private connectionEndpoint: ConnectionEndpoint) {
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
