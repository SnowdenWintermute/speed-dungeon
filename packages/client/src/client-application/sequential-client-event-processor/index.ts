import { GameWorldView } from "@/game-world-view";

export class SequentialClientEventProcessor {
  constructor(private gameWorldView: null | GameWorldView) {}

  clearAllModelsHandler() {
    if (this.gameWorldView === null) {
      return;
    }
    const { modelManager } = this.gameWorldView;
    modelManager.clearAllModels();
  }
}
