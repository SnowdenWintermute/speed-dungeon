// import { SpeedDungeonGame } from "../../../game/index.js";
// import { ActionResult } from "../action-result.js";

// export default function allTargetsWereKilled(
//   game: SpeedDungeonGame,
//   actionResult: ActionResult
// ): Error | boolean {
//   let allDamagedTargetsWereKilled = true;

//   // if there was a miss, that entity would still be alive
//   if (actionResult.missesByEntityId?.length) {
//     return false;
//   }

//   if (actionResult.hitPointChangesByEntityId !== null) {
//     for (const [combatantId, hpChange] of Object.entries(actionResult.hitPointChangesByEntityId)) {
//       // if they're being healed, they aren't being defeated. also this would mess with lifesteal
//       // beacuse it would see the hp change of the lifestealer
//       if (hpChange.value > 0) continue;

//       const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
//       if (combatantResult instanceof Error) return combatantResult;
//       const { combatantProperties } = combatantResult;
//       if (combatantProperties.hitPoints + hpChange.value > 0) {
//         allDamagedTargetsWereKilled = false;
//         break;
//       }
//     }
//   }

//   return allDamagedTargetsWereKilled;
// }
