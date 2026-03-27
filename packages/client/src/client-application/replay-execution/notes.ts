// get tree
// take note of completion order ids
// start processing first node
//
//
// On Tick
// - if no current ReplayTreeExecution, start the next if it exists
// - if current ReplayTreeExecution
//   - process each active BranchExecution until none can be completed
//
// Process BranchExecution
//   - If current ReplayStepExecution isReadyToComplete
//     - check if it is next in completion order
//     - if not, return early
//     - if so,
//       - run its onComplete (dispatch effects to ClientApplication state)
//       - check for a next ReplayBranchNode
//       - if none exists, mark branch as complete
//       - else, handle new ReplayBranchNode
//
// Handle new ReplayBranchNode
//   - if Branch, start new BranchExecution
//   - if GameUpdate, handle start of new ReplayStepExecution
//     - dispatch onStartReplayBranchNode side effects to GameWorldView
//       - animations
//       - translations
//       - cosmetic effects
//     - determine duration to completion
//     - process this BranchExecution
