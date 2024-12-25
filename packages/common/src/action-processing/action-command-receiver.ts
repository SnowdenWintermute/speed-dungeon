import {
  BattleResultActionCommandPayload,
  GameMessagesPayload,
  MoveIntoCombatActionPositionActionCommandPayload,
  PayAbilityCostsActionCommandPayload,
  PerformCombatActionActionCommandPayload,
  ReturnHomeActionCommandPayload,
} from "./index.js";

export interface ActionCommandReceiver {
  payAbilityCostsActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: PayAbilityCostsActionCommandPayload
  ) => Promise<Error | void>;
  moveIntoCombatActionPositionActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: MoveIntoCombatActionPositionActionCommandPayload
  ) => Promise<Error | void>;
  performCombatActionActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: PerformCombatActionActionCommandPayload
  ) => Promise<Error | void>;
  returnHomeActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: ReturnHomeActionCommandPayload
  ) => Promise<Error | void>;
  battleResultActionCommandHandler: (
    gameName: string,
    combatantId: string,
    payload: BattleResultActionCommandPayload
  ) => Promise<Error | void>;
  gameMessageCommandHandler: (payload: GameMessagesPayload) => Promise<Error | void>;
  removePlayerFromGameCommandHandler: (username: string) => Promise<Error | void>;
}
