import { ClientIntent, ConnectionEndpoint, GameStateUpdate } from "@speed-dungeon/common";
import { ClientApplication } from "..";
import { ConnectionTopology, RuntimeMode } from "../connection-topology";
import { ConnectionStatus } from "../ui/connection-status";
import { ClientEventType } from "../sequential-client-event-processor/client-events";

export abstract class BaseClient {
  constructor(
    protected name: string,
    protected connectionEndpoint: ConnectionEndpoint,
    protected clientApplication: ClientApplication,
    protected connectionTopology: ConnectionTopology,
    protected _targetRuntimeMode: RuntimeMode
  ) {
    this.registerListeners();
  }

  set targetRuntimeMode(newMode: RuntimeMode) {
    this._targetRuntimeMode = newMode;
  }

  dispatchIntent(message: ClientIntent) {
    this.connectionEndpoint.send(JSON.stringify(message));
  }

  close() {
    this.connectionEndpoint.close();
  }

  setEndpoint(connectionEndpoint: ConnectionEndpoint) {
    const oldEndpoint = this.connectionEndpoint;
    this.connectionEndpoint = connectionEndpoint;
    this.registerListeners();
    oldEndpoint.close();
  }

  protected registerListeners() {
    this.connectionEndpoint.on("open", () => {
      console.info(`connected to ${this.name}`);
      const { gameContext, uiStore, gameWorldView } = this.clientApplication;
      gameContext.clearGame();
      this.connectionTopology.runtimeMode = this._targetRuntimeMode;
      uiStore.connectionStatus.connectionStatus = ConnectionStatus.Connected;

      this.clientApplication.sequentialEventProcessor.cancelQueued();
      this.clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientEventType.ClearAllModels,
        data: undefined,
      });
      this.clientApplication.replayTreeScheduler.clear();

      // this.dispatchIntent({ type: ClientIntentType.RequestsGameList, data: undefined });
      // this.dispatchIntent({ type: ClientIntentType.GetSavedCharactersList, data: undefined });
    });

    this.connectionEndpoint.on("message", (untyped) => {
      const typedMessage = this.getTypedMessage(untyped);
      this.handleMessage(typedMessage);
    });

    this.connectionEndpoint.on("close", (reason) => {
      console.info(`closed connection endpoint with code ${reason}`);
    });
  }

  abstract resetConnection(): void;

  protected abstract handleMessage(message: GameStateUpdate): void;

  protected getTypedMessage(rawData: string | ArrayBuffer) {
    const asString = rawData.toString();
    const asJson = JSON.parse(asString);
    const typedMessage = asJson as GameStateUpdate;
    return typedMessage;
  }
}
