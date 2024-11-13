import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import { BattleReport, ClientToServerEvent } from "@speed-dungeon/common";

export default function battleReportHandler(report: BattleReport) {
  // once all clients have told the server they know about the items,
  // the server will start to accept requests to pick up the items.
  // That way no client will end up getting an update about an item
  // that was already picked up
  for (const item of report.loot) {
    websocketConnection.emit(
      ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
      item.entityProperties.id
    );
  }

  useGameStore.getState().mutateState((gameState) => {
    gameState.battleReportPendingProcessing = report;
  });
}
