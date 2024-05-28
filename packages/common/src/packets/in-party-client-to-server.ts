import { CombatAction } from "../combat";
import { CombatAttribute } from "../combatants";

export enum InPartyClientToServerEvent {
  SelectCombatAction = "0",
  IncrementAttribute = "1",
}

export interface InPartyClientToServerEventTypes {
  [InPartyClientToServerEvent.SelectCombatAction]: (
    characterId: string,
    combatActionOption: null | CombatAction
  ) => void;
  [InPartyClientToServerEvent.IncrementAttribute]: (
    characterId: string,
    attribute: CombatAttribute
  ) => void;
}
