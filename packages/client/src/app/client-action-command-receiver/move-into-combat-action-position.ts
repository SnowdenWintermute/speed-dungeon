import {
  AdventuringParty,
  CombatantAssociatedData,
  CombatantProperties,
  MoveIntoCombatActionPositionActionCommandPayload,
} from "@speed-dungeon/common";
import { combatantAssociatedDataProvider } from "../WebsocketManager/combatant-associated-details-providers";
import { ClientActionCommandReceiver } from ".";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameState } from "@/stores/game-store";

export default function moveIntoCombatActionPositionActionCommandHandler(
  this: ClientActionCommandReceiver,
  _gameName: string,
  combatantId: string,
  payload: MoveIntoCombatActionPositionActionCommandPayload
) {
  combatantAssociatedDataProvider(
    this.mutateGameState,
    this.mutateAlertState,
    combatantId,
    (combatantAssociatedData: CombatantAssociatedData) =>
      handler(
        combatantAssociatedData,
        payload,
        this.mutateNextBabylonMessagingState,
        this.mutateGameState
      )
  );
}

// CLIENT
// - lock/hide this character's ui to show the animation
// - calculate their destination location and rotation based on payload target and ability type (melee/ranged)
// - start animating them toward their destination
// - on reach destination, process the next command

function handler(
  combatantAssociatedData: CombatantAssociatedData,
  payload: MoveIntoCombatActionPositionActionCommandPayload,
  mutateNextBabylonMessagingState: MutateState<NextBabylonMessagingState>,
  mutateGameState: MutateState<GameState>
) {
  const { combatant } = combatantAssociatedData;
  CombatantProperties.lockInput(combatant.combatantProperties);

  mutateNextBabylonMessagingState((state) => {
    state.nextToBabylonMessages.push({
      type: NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition,
      actionCommandPayload: payload,
      actionUserId: combatantAssociatedData.combatant.entityProperties.id,
      onComplete: () => {
        mutateGameState((gameState) => {
          const partyResult = gameState.getParty();
          if (partyResult instanceof Error) return console.error(partyResult);
          partyResult.actionCommandManager.processNextCommand();
        });
      },
    });
  });
}
