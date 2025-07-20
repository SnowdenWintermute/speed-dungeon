// import { CombatActionName } from "../../combat-actions/combat-action-names.js";
// import { AIBehaviorContext } from "../ai-context.js";
// import { BehaviorNode, Selector, Sequence } from "../behavior-tree.js";
// import { SetAvailableTargetsAndUsableActions } from "./set-available-targets-and-usable-actions.js";

// export class SetSelectedActionAndTargets {
//   private root: BehaviorNode;

//   constructor(private context: AIBehaviorContext) {
//     // set a selected action and targets
//     this.root = new Selector([
//       new Selector([
//         // HEALING
//         new Sequence([
//           // collect a list of valid healing targets
//           new SetAvailableTargetsAndUsableActions(
//             this.context,
//             (action: CombatActionName) => {
//               throw new Error("Not implemented");
//             },
//             () => {
//               throw new Error("Not implemented");
//             },
//             () => {
//               throw new Error("Not implemented");
//             }
//           ),
//           // choose the most effective healing action on the available targets
//           new BehaviorLeaf((context: AIBehaviorContext) => {
//             const mostEffectiveAction: CombatActionName | null = null;
//             if (mostEffectiveAction) {
//               // set selected action  / targets in context
//               return true;
//             } else return false;
//           }),
//         ]),
//         // ATTACKS
//         new Sequence([
//           // collect a list of valid enemy targets
//           new SetAvailableTargetsAndUsableActions(
//             this.context,
//             (action: CombatActionName) => {
//               throw new Error("Not implemented");
//             },
//             () => {
//               throw new Error("Not implemented");
//             },
//             () => {
//               throw new Error("Not implemented");
//             }
//           ),
//           new BehaviorLeaf((context: AIBehaviorContext) => {
//             // choose most effective targed taking into account the AIHostileTargetSelectionScheme
//             const mostEffectiveAction: CombatActionName | null = null;
//             if (mostEffectiveAction) {
//               // set selected action  / targets in context
//               return true;
//             } else return false;
//           }),
//         ]),
//       ]),
//     ]);
//   }

//   execute(): boolean {
//     return this.root.execute();
//   }
// }
