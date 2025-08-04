// Attack Randomly
// Sequence (all must succeed)
// - CollectAllOwnedActionsByIntent(ActionIntent.Malicious)
//   - if no owned actions by that intent, return State.Failure
//   - write owned malicious actions on blackboard.consideredActions
//   - return State.Success
// - ChooseRandomValidAction(blackboard.consideredActions)
//   - Randomizer(blackboard.consideredActions)
//   - UntilFail
//     - Inverter
//      - Sequence
//         - Selector (first successful)
//           - PopFromStack(blackboard.consideredActions, currentActionNameConsidered)
//           - Succeeder (stack has finished)
//         - CheckIfActionUsable(currentActionNameConsidered)
//         - CollectPotentialTargetsForAction(currentActionNameConsidered)
//             - CollectPotentialTargets(currentActionNameConsidered)
//               - blackboard.usableActionsWithValidTargets[actionName].push(target)
//    - SetSelectedActionName(Object.values( blackboard.usableActionsWithValidTargets )[0])
// - ChooseRandomTargets(blackboard.selectedActionName)
//  - Randomizer(blackboard.usableActionsWithValidTargets[blackboard.selectedActionName].validTargets)
//  - UntilFail
//   - Inverter
//     - Sequence (all must succeed)
//       - PopFromStack(blackboard.validTargets)
//       - set blackboard.selectedTargets
