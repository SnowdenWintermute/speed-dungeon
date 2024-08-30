import {
  AdventuringParty,
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  CombatantAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
  MoveIntoCombatActionPositionActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { combatantAssociatedDataProvider } from "../WebsocketManager/combatant-associated-details-providers";
import { ClientActionCommandReceiver } from ".";
import { Vector3 } from "babylonjs";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameState } from "@/stores/game-store";
import cloneDeep from "lodash.clonedeep";

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
  const { party, combatant } = combatantAssociatedData;
  CombatantProperties.lockInput(combatant.combatantProperties);
  const { primaryTargetId, isMelee } = payload;
  const primaryTargetResult = AdventuringParty.getCombatant(party, primaryTargetId);
  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const primaryTarget = primaryTargetResult;

  const { destinationLocation, totalTimeToReachDestination } =
    CombatantProperties.getPositionForActionUse(
      combatant.combatantProperties,
      primaryTarget.combatantProperties,
      isMelee
    );

  const targetPosition = cloneDeep(primaryTarget.combatantProperties.homeLocation);

  mutateNextBabylonMessagingState((state) => {
    state.nextToBabylonMessages.push({
      type: NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition,
      destinationLocation,
      totalTimeToReachDestination,
      targetPosition,
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
