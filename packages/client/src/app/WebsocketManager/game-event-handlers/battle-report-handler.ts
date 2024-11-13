import { useGameStore } from "@/stores/game-store";
import {
  BattleReport,
  ClientToServerEvent,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function battleReportHandler(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  report: BattleReport
) {
  // once all clients have told the server they know about the items,
  // the server will start to accept requests to pick up the items.
  // That way no client will end up getting an update about an item
  // that was already picked up
  for (const item of report.loot) {
    socket.emit(
      ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
      item.entityProperties.id
    );
  }

  useGameStore.getState().mutateState((gameState) => {
    gameState.battleReportPendingProcessing = report;
  });
}
