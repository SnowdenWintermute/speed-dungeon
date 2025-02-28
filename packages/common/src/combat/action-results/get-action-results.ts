// import { Battle } from "../../battle/index.js";
// import { SpeedDungeonGame } from "../../game/index.js";
// import { CombatActionTarget } from "../targeting/combat-action-targets.js";
// import { ActionResult } from "./action-result.js";
// import { ActionResultCalculationArguments } from "./action-result-calculator.js";
// import calculateActionResult from "./index.js";
// import { CombatActionComponent } from "../combat-actions/index.js";

// export default function getActionResults(
//   game: SpeedDungeonGame,
//   userId: string,
//   combatAction: CombatActionComponent,
//   abilityTarget: CombatActionTarget,
//   battleOption: null | Battle,
//   allyIds: string[]
// ): Error | ActionResult[] {
//   // @TODO - consider redoing or disposing of this function

//   const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
//   if (userCombatantResult instanceof Error) return userCombatantResult;
//   const { combatantProperties: userCombatantProperties } = userCombatantResult;

//   const args: ActionResultCalculationArguments = {
//     combatAction,
//     userId,
//     targets: abilityTarget,
//     battleOption,
//     allyIds,
//   };

//   calculateActionResult(game, args);

//   return [];
// }
