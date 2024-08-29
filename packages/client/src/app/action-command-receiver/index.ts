import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import {
  ActionCommandReceiver,
  BattleResultActionCommandPayload,
  ChangeEquipmentActionCommandPayload,
  MoveIntoCombatActionPositionActionCommandPayload,
  PayAbilityCostsActionCommandPayload,
  PerformCombatActionActionCommandPayload,
} from "@speed-dungeon/common";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor(
    public mutateGameState: MutateState<GameState>,
    public mutateAlertState: MutateState<AlertState>,
    public mutateNextBabylonMessagingState: MutateState<NextBabylonMessagingState>
  ) {}
  payAbilityCostsActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: PayAbilityCostsActionCommandPayload
  ) => void = () => {};
  moveIntoCombatActionPositionActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: MoveIntoCombatActionPositionActionCommandPayload
  ) => void = () => {};
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
