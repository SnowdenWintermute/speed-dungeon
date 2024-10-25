import {
  BattleResultActionCommandPayload,
  ChangeEquipmentActionCommandPayload,
  LadderUpdatePayload,
  MoveIntoCombatActionPositionActionCommandPayload,
  PayAbilityCostsActionCommandPayload,
  PerformCombatActionActionCommandPayload,
  ReturnHomeActionCommandPayload,
} from "./index.js";
import { ActionCommandManager } from "./action-command-manager.js";

export interface ActionCommandReceiver {
  payAbilityCostsActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: PayAbilityCostsActionCommandPayload
  ) => void;
  moveIntoCombatActionPositionActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: MoveIntoCombatActionPositionActionCommandPayload
  ) => void;
  performCombatActionActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: PerformCombatActionActionCommandPayload
  ) => void;
  returnHomeActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: ReturnHomeActionCommandPayload
  ) => void;
  changeEquipmentActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: ChangeEquipmentActionCommandPayload
  ) => void;
  battleResultActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: BattleResultActionCommandPayload
  ) => void;
  ladderUpdateActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    payload: LadderUpdatePayload
  ) => void;
}
