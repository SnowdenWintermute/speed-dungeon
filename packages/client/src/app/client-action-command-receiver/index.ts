import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import {
  ActionCommandReceiver,
  BattleResultActionCommandPayload,
  ChangeEquipmentActionCommandPayload,
  PerformCombatActionActionCommandPayload,
} from "@speed-dungeon/common";
import payAbilityCostsActionCommandHandler from "./pay-ability-costs";
import moveIntoCombatActionPositionActionCommandHandler from "./move-into-combat-action-position";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor(
    public mutateGameState: MutateState<GameState>,
    public mutateAlertState: MutateState<AlertState>,
    public mutateNextBabylonMessagingState: MutateState<NextBabylonMessagingState>
  ) {}
  payAbilityCostsActionCommandHandler = payAbilityCostsActionCommandHandler;

  moveIntoCombatActionPositionActionCommandHandler =
    moveIntoCombatActionPositionActionCommandHandler;
  performCombatActionActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: PerformCombatActionActionCommandPayload
  ) => void = () => {};
  returnHomeActionCommandHandler: (gameName: string, combatantId: string) => void = () => {};
  changeEquipmentActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: ChangeEquipmentActionCommandPayload
  ) => void = () => {};
  battleResultActionCommandHandler: (
    gameName: string,
    payload: BattleResultActionCommandPayload
  ) => void = () => {};
}
