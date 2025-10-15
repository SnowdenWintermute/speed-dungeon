import { ActionUserContext, Combatant, EntityId, SpeedDungeonGame } from "@speed-dungeon/common";

export class AppStoreManager {
  game: null | SpeedDungeonGame = null;

  // Misc Game UI
  username: null | string = null;
  combatantsWithPendingCraftActions: Partial<Record<EntityId, boolean>> = {};

  authFormEmailField: string = "";

  hasGame: () => boolean = () => {
    throw new Error("not implementeted");
  };

  getFocusedCharacter: () => Error | Combatant = () => {
    throw new Error("not implementeted");
    // return getFocusedCharacter();
  };

  constructor() {}
}

export function getActionUserContext(): Error | ActionUserContext {
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
