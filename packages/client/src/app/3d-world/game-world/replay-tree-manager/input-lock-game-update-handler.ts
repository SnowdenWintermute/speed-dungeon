import getCurrentParty from "@/utils/getCurrentParty";
import { useGameStore } from "@/stores/game-store";
import { InputLock, InputLockUpdateCommand } from "@speed-dungeon/common";

export async function inputLockGameUpdateHandler(update: {
  command: InputLockUpdateCommand;
  isComplete: boolean;
}) {
  if (!update.command.isLocked) {
    console.log("unlocking input due to InputLockUpdateCommand");
    useGameStore.getState().mutateState((state) => {
      const partyOption = getCurrentParty(state, state.username || "");
      if (partyOption) InputLock.unlockInput(partyOption.inputLock);
    });
  }
}
