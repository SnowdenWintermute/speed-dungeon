import { ActionUserContext, Combatant, SpeedDungeonGame } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class GameStore {
  game: null | SpeedDungeonGame = null;
  username: null | string = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  hasGame: () => boolean = () => {
    throw new Error("not implementeted");
  };

  getFocusedCharacter: () => Error | Combatant = () => {
    throw new Error("not implementeted");
    // return getFocusedCharacter();
  };

  getActionUserContext(): Error | ActionUserContext {
    throw new Error("not implemented");
    // const gameOption = gameState.game;

    // if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    // const game = gameOption;
    // if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    // const partyOptionResult = getCurrentParty(gameState, gameState.username);
    // if (partyOptionResult instanceof Error) return partyOptionResult;
    // if (partyOptionResult === undefined) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    // const party = partyOptionResult;
    // const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
    // if (combatantResult instanceof Error) return combatantResult;
    // return new ActionUserContext(game, party, combatantResult);
  }
}
