import { GameWorldView } from "@/game-world-view";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";
import { ConnectionStatus } from "@/mobx-stores/connection-status";
import { getApplicationRuntimeManager } from "@/singletons";
import { RuntimeMode } from "@/singletons/application-runtime-environment-manager";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { ClientIntent, ConnectionEndpoint, GameStateUpdate } from "@speed-dungeon/common";

export abstract class BaseClient {
  constructor(
    protected name: string,
    protected connectionEndpoint: ConnectionEndpoint,
    protected appStore: AppStore,
    protected gameWorldView: {
      current: null | GameWorldView;
    },
    protected characterAutoFocusManager: CharacterAutoFocusManager,
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
      this.appStore.gameStore.clearGame();
      getApplicationRuntimeManager().runtimeMode = this._targetRuntimeMode;
      this.appStore.connectionStatusStore.connectionStatus = ConnectionStatus.Connected;

      this.gameWorldView.current?.modelManager.modelActionQueue.clear();
      this.gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.ClearAllModels,
      });

      this.gameWorldView.current?.replayTreeManager.clear();
      this.gameWorldView.current?.actionEntityManager
        .getAll()
        .forEach((entity) => entity.cleanup({ softCleanup: false }));

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
