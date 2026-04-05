import {
  ClientIntent,
  ConnectionEndpoint,
  GameStateUpdate,
  GameStateUpdateType,
} from "@speed-dungeon/common";
import { ClientApplication } from "..";
import { ConnectionMode, ConnectionTopology } from "../connection-topology";
import { ConnectionStatus } from "../ui/connection-status";

export abstract class BaseClient {
  // for determining if we have received a reply stream from the server
  // which is associated with our sent client intent
  private _intentSequenceCounter = 0;
  private _pendingReplies = new Map<number, () => void>();

  constructor(
    protected name: string,
    protected connectionEndpoint: ConnectionEndpoint,
    protected clientApplication: ClientApplication,
    protected connectionTopology: ConnectionTopology,
    protected _targetConnectionMode: ConnectionMode
  ) {
    this.registerListeners();
  }

  set targetConnectionMode(newMode: ConnectionMode) {
    this._targetConnectionMode = newMode;
  }

  resetIntentSequenceCounter() {
    this._intentSequenceCounter = 0;
  }

  dispatchIntent(message: ClientIntent): number {
    this._intentSequenceCounter += 1;
    this.connectionEndpoint.send(JSON.stringify(message));
    return this._intentSequenceCounter;
  }

  waitForServerReply(sequenceId: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this._pendingReplies.set(sequenceId, resolve);
    });
  }

  waitForClientProcessing(): Promise<void> {
    return this.clientApplication.sequentialEventProcessor.waitUntilIdle();
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
      const { gameContext, uiStore } = this.clientApplication;
      gameContext.clearGame();
      this.connectionTopology.runtimeMode = this._targetConnectionMode;
      uiStore.connectionStatus.connectionStatus = ConnectionStatus.Connected;

      // this.clientApplication.sequentialEventProcessor.cancelQueued();
      // this.clientApplication.sequentialEventProcessor.scheduleEvent({
      //   type: ClientSequentialEventType.ClearAllModels,
      //   data: undefined,
      // });
      this.clientApplication.replayTreeScheduler.clear();

      // this.dispatchIntent({ type: ClientIntentType.RequestsGameList, data: undefined });
      // this.dispatchIntent({ type: ClientIntentType.GetSavedCharactersList, data: undefined });
    });

    this.connectionEndpoint.on("message", (untyped) => {
      const typedMessage = this.getTypedMessage(untyped);
      this.handleEndOfStream(typedMessage);
      this.handleErrorMessage(typedMessage);
      this.handleMessage(typedMessage);
    });

    this.connectionEndpoint.on("close", (reason) => {
      console.info(`closed connection endpoint with code ${reason}`);
    });
  }

  private handleErrorMessage(typedMessage: GameStateUpdate) {
    if (typedMessage.type !== GameStateUpdateType.ErrorMessage) return;

    const { message, clientIntentSequenceId } = typedMessage.data;
    const { alertsService, errorRecordService, gameContext, combatantFocus, targetIndicatorStore } =
      this.clientApplication;

    errorRecordService.record(message, clientIntentSequenceId);
    alertsService.setAlert(message);

    const { partyOption } = gameContext;
    if (!partyOption) return;

    // this is a quick and dirty fix until we have a way to associate errors
    // with certain actions, which would also be good to associate responses with
    // certain actions so we can show the buttons in a loading state
    partyOption.inputLock.unlockInput();
    const { focusedCharacterOption } = combatantFocus;
    if (!focusedCharacterOption) return;

    focusedCharacterOption.combatantProperties.targetingProperties.clear();
    targetIndicatorStore.clearUserTargets(focusedCharacterOption.getEntityId());
  }

  private handleEndOfStream(typedMessage: GameStateUpdate) {
    if (typedMessage.type === GameStateUpdateType.EndOfUpdateStream) {
      const resolver = this._pendingReplies.get(typedMessage.data.clientIntentSequenceId);
      if (resolver) {
        this._pendingReplies.delete(typedMessage.data.clientIntentSequenceId);
        resolver();
      }
      return;
    }
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
