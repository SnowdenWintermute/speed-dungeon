import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { ActionCommandReceiver, ChangeEquipmentActionCommandPayload } from "@speed-dungeon/common";
import payAbilityCostsActionCommandHandler from "./pay-ability-costs";
import moveIntoCombatActionPositionActionCommandHandler from "./move-into-combat-action-position";
import performCombatActionActionCommandHandler from "./perform-combat-action";
import returnHomeActionCommandHandler from "./return-home";
import battleResultActionCommandHandler from "./process-battle-result";
import { ActionCommandManager } from "@speed-dungeon/common";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor(
    public mutateGameState: MutateState<GameState>,
    public mutateAlertState: MutateState<AlertState>,
    public mutateNextBabylonMessagingState: MutateState<NextBabylonMessagingState>
  ) {}

  payAbilityCostsActionCommandHandler = payAbilityCostsActionCommandHandler;

  moveIntoCombatActionPositionActionCommandHandler =
    moveIntoCombatActionPositionActionCommandHandler;
  performCombatActionActionCommandHandler = performCombatActionActionCommandHandler;
  returnHomeActionCommandHandler = returnHomeActionCommandHandler;
  battleResultActionCommandHandler = battleResultActionCommandHandler;

  changeEquipmentActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: ChangeEquipmentActionCommandPayload
  ) => void = () => {};
}
