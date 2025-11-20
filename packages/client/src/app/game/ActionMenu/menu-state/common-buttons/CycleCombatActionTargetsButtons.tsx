import React from "react";
import { observer } from "mobx-react-lite";
import { ListCyclingButtons } from "./ListCyclingButtons";
import { ClientToServerEvent, NextOrPrevious } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { websocketConnection } from "@/singletons/websocket-connection";

export const CycleCombatActionTargetsButtons = observer(() => {
  const { gameStore } = AppStore.get();
  const characterId = gameStore.getExpectedFocusedCharacterId();

  function onCycle(direction: NextOrPrevious) {
    websocketConnection.emit(ClientToServerEvent.CycleCombatActionTargets, {
      characterId,
      direction,
    });
  }

  return (
    <ListCyclingButtons
      onCycle={onCycle}
      itemCount={null}
      currentIndex={0}
      directionTitle="Target"
      listTitle={""}
    />
  );
});
