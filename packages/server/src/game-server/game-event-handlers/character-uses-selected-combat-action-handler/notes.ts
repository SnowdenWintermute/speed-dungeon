// - pre-use-positioning
//   - push command to ReplayEventNode
//   - check if time elapsed is enough to be considered completed and transition to next step if so
// - start-use-animating - (combatant animations until percentToConsiderAsComplete)
//   - get start-use animation if not already playing
//   - check if time elapsed is enough and transition to next step if so
// - pay action costs
//   - update game state and add a PayActionCosts ReplayEventNode
//   - push triggered "on use" actions with new child ReplayEventNode
//     - ex: apply counterNextSpell condition, animateCounterSpellApplication
//   - transition to next step
// - actionUse - (update values in game state)
//   - for each target
//     - roll hit/crit/parry/block or triggered counterspell
//     - start triggered events with new child ReplayEventNodes (hit recovery, dodge, block, parry animations, triggered explosions)
//     - transition to next step
// - post-use-animating - (combatant animation, combatant equipment animation)
//   - based on if blocked, parried, countered or missed, transition to an animation or continue current one
//   - if elapsed time is enough, transition to next step
// - post-use-positioning (might die in transit to returning home)
//   - check if elapsed time is enough to have reached destination
//   - if reached destination or dead, transition to next step
//
//
// - get initial action / sub actions and put them in an actionsExecuting object
// - tick and process any executing actions
//   - update the ticked ms
//   for each executing action
//     - if just started, add it's replayEventNode to the tree
//     - if(!currentActionExecutionEvent) executingAction.getNextEvent()
//     - process currentActionExecutionEvent by increasing its ms, checking if done, updating game state, and updating the replayEventTree node
//     - if it is done, get the next event
//     - if executing.getNextEvent() === undefined, remove it from executing actions and fetch the next action in the child list
//
// push pre-use animation effects to results and apply
// push paid costs to results
// process triggers for "on use" ex: counter spell (continue), deploy shield (process deploy shield result immediately)
// - should determine ("success" or "failure" state)
// push on-success or on-failure animation effects
// push resource changes and conditions applied to results
// process triggers for "on hit" ex: detonate explosive, interrupt channeling
// - push triggered actions to the stack
// process triggers for "on evade" ex: evasion stacks increased
// build the action commands from the result on server and apply to game
// continue building the list of action results for the client to use

// uses LMP Chain Arrow
// deduct costs
// filter through "on use" trigger gate
// simultaneously animate three arrows on three targets
// - for each SubAction
//   . create a GameUpdateCommand sub-stack
//   . push projectile effect vfx to sub-stack
//   . roll for hits
//   . filter through "on hit or evade" trigger gate (parries, blocks, counters, triggered actions)
//   . accumulate hit triggered GameUpdateCommands
//   . for each hit triggered action
//     - recursively resolve them
//   . apply value changes
//
// await Promise.all(GameUpdateCommand sub-stack) to simultaneously show the animations and value changes
//
// arrows 1, 2 and 3 start animating
// arrow 1 effect reaches closest target
// arrow 1 hits target, triggering an explosion
// explosion 1 starts animating
// explosion 1 finishes animation, killing farthest arrow's target
// arrow 2 hits midrange target, target parries and animates parry, transitioning from it's hit recovery animation from the explosion
// arrow 3 reaches farthest target, it is already dead
//
// const eventTree = new EventNode();
// let mostRecentlyCompletedEventId = 0;
// async function createEventTreeFromActionUse(action: CombatActionComponent, parentNode: EventNode){
//   const eventNode = new EventNode()
//   parentNode.addChild(eventNode)
//
//   if(action.subActions) {
//     const subActionPromises = []
//     for(const subAction of action.subActions){
//       subActionPromises.push(createEventTreeFromActionUse(subAction, eventNode))
//     }
//     await Promise.all(subActionPromises)
//   }
//
//
//   const preExecutionAnimations = action.getPreExecutionAnimations();
//   for(const animation of preExecutionAnimations){
//     const event = new AnimationEvent(animation)
//     eventNode.events.push(event)
//     await animation.play()
//     event.completionOrderId = mostRecentlyCompletedEventId++;
//   }
//
//
//   const executionAnimations = action.getExecutionAnimations();
//   for(const animation of executionAnimations) {
//     const event = new AnimationEvent(animation)
//     eventNode.events.push(event)
//     await () => new Promise((resolve) => {
//       animation.playWithPercentCompleteEvent(
//         { onPercentPlayed: () => resolve(), percent: action.getExecutionAnimationPercentToProceed() }
//         ));
//     event.completionOrderId = mostRecentlyCompletedEventId++;
//   }
//
//   for(const targetId of action.targets) {
//      const node = new EventNode()
//      eventNode.addChild(node)
//
//      const target = game.getCombatantById(targetId)
//      const isAboutToHitTarget = action.isAboutToHitTarget(action, target)
//
//      if (isAboutToHitTarget) {
//          const isParried = target.rollParry(action)
//          const arbitraryAnimationPercentageToProcessNextEvents = .7 // look up in dict later
//
//          if(!target.isValidTarget(action)) {
//            const targetNoLongerValidEvent = new TargetNoLongerValidEvent(action, target)
//            node.events.push(targetNoLongerValidEvent)
//            targetNoLongerValidEvent.completionOrderId = mostRecentlyCompletedEventId ++
//            continue;
//          }
//
//          if(isParried) {
//            const parryAnimation = target.getParryAnimation()
//            const parryAnimationEvent = new AnimationEventWithPercentCompleteEvents(parryAnimation, [{
//              percentComplete: arbitraryAnimationPercentageToProcessNextEvents,
//              event: (self: AnimationEventWithPercentCompleteEvents) => done(self)
//            }])
//
//            node.events.push(event)
//
//            await () => new Promise((resolve) => parryAnimation.playWithPercentCompleteEvents({ percent: arbitraryAnimationPercentageToProcessNextEvents, event: () => {resolve()} }))
//            parryAnimationEvent.completionOrderId = mostRecentlyCompletedEventId++
//            const parryEvent = new GameStateUpdate(GameStateUpdateType.Parried)
//            node.events.push(parryEvent)
//            parryEvent.completionOrderId = mostRecentlyCompletedEventId++
//          } else {
//            const hitRecoveryAnimation = target.getHitRecoveryAnimation()
//            const hitRecoveryAnimationEvent = new AnimationEventWithPercentCompleteEvents(hitRecoveryAnimation, [{
//              percentComplete: arbitraryAnimationPercentageToProcessNextEvents,
//              event: (self: AnimationEventWithPercentCompleteEvents) => done(self)
//            }])
//
//            node.events.push(event)
//
//            await () => new Promise((resolve) => hitRecoveryAnimation.playWithPercentCompleteEvents({ percent: arbitraryAnimationPercentageToProcessNextEvents, event: () => {resolve()} }))
//            hitRecoveryAnimationEvent.completionOrderId = mostRecentlyCompletedEventId++
//            const hpChangeEvent = new GameStateUpdate(GameStateUpdateType.HpChange)
//            node.events.push(hpChangeEvent)
//            hpChangeEvent.completionOrderId = mostRecentlyCompletedEventId++
//            const triggeredActionsOption = target.getTriggeredActions(action ,Trigger.OnHit);
//            if(triggeredActionsOption) {
//              const triggeredActionPromises = []
//              for(const triggeredAction of triggeredActionsOption){
//                triggeredActionPromises.push(createEventTreeFromActionUse(triggeredAction, node))
//              }
//              Promise.all(triggeredActionPromises)
//            }
//          }
//      }
//   }
// }
//
//
