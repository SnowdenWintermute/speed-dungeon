import { SpeedDungeonGame } from "../../game";
import { EntityId } from "../../primatives";
import {
  AIActionSelectionScheme,
  AIHostileTargetSelectionScheme,
} from "./target-selection-calculator";

interface BehaviorNode {
  execute(): boolean;
}

class Selector implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (child.execute()) return true;
    }
    return false;
  }
}

class Sequence implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (!child.execute()) return false;
    }
    return true;
  }
}

// Decorator node: Condition (executes child node only if condition is met)
class Condition implements BehaviorNode {
  constructor(
    private condition: () => boolean,
    private child: BehaviorNode
  ) {}

  execute(): boolean {
    if (this.condition()) return this.child.execute();
    return false;
  }
}

// Leaf node: Action (performs an action and returns success or failure)
class BehaviorLeaf implements BehaviorNode {
  constructor(public execute: (...args: any[]) => boolean) {}
}

class Inverter implements BehaviorNode {
  constructor(private child: BehaviorNode) {}

  execute(): boolean {
    return !this.child.execute();
  }
}

class RepeatUntilFail implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (!child.execute()) return false;
    }
    return this.execute();
  }
}

// Example AI context
class AIBehaviorContext {
  private actionSelectionScheme: AIActionSelectionScheme = AIActionSelectionScheme.Basic;
  private hostileTargetSelectionScheme: AIHostileTargetSelectionScheme =
    AIHostileTargetSelectionScheme.Enmity;
  private enmityList: { combatantId: EntityId; enmity: number }[] = [];
  constructor(
    private entityId: EntityId,
    private game: SpeedDungeonGame,
    private battleId: EntityId
  ) {}
}

// on turn
// allies are damaged
// - determine most potential healing
//  - iterate through healing options
//  - set most potential average healing so far
//  - after loop, select that action
// allies are not damaged
// - determine most hated target
// - iterate options for most damaging move
// - select the most damaging move
// execute selected move
// if no useable move, end turn
// if only one set of combatants remain, end the battle

class BasicAIActionSelector {
  private root: BehaviorNode;

  constructor(private context: AIBehaviorContext) {
    this.root = new Selector([
      // do a combat action or end the battle if can't
      new Sequence([
        // select and perform a combat action if possible
        new Selector([
          // select and perform a healing action if appropriate, otherwise attack
          new Sequence([
            // select a healing action and targets if appropriate
            new BehaviorLeaf((context: AIBehaviorContext) => {
              // set list of allies below 50%
              return true;
            }),
            new Selector([
              new BehaviorLeaf((context: AIBehaviorContext) => {
                // set healing consumable in inventory as selected action
                return true;
              }),
              new BehaviorLeaf((context: AIBehaviorContext) => {
                // set healing ability with an afforbale mp cost as selected action
                return true;
              }),
            ]),
            new BehaviorLeaf((context: AIBehaviorContext) => {
              // select best valid target for selected action
              return true;
            }),
          ]),
          new Sequence([
            // select an offensive action and targets if able
            new BehaviorLeaf((context: AIBehaviorContext) => {
              // set list of valid enemy targets
              return true;
            }),
            new Selector([
              new BehaviorLeaf((context: AIBehaviorContext) => {
                // set healing consumable in inventory as selected action
                return true;
              }),
              new BehaviorLeaf((context: AIBehaviorContext) => {
                // set healing ability with an afforbale mp cost as selected action
                return true;
              }),
            ]),
            new BehaviorLeaf((context: AIBehaviorContext) => {
              // select best valid target for selected action
              return true;
            }),
          ]),
        ]),
        new BehaviorLeaf((context: AIBehaviorContext) => {
          // perform selected action on selected target
          return true;
        }),
      ]),

      new BehaviorLeaf(() => {
        // end the battle
        return true;
      }),
    ]);
  }
  //   this.root = new Selector(
  //     new Sequence(
  //       new Condition(
  //         () => context.offensive,
  //         new Selector(
  //           new Action(() => {
  //             if (context.threatTargets.length > 0) {
  //               const target = context.threatTargets[0]; // Example logic: pick the highest threat
  //               return context.attackTarget(target.id);
  //             }
  //             return false;
  //           }),
  //           new Action(() => {
  //             if (context.lowHealthTargets.length > 0) {
  //               const target = context.lowHealthTargets[0]; // Example logic: pick the lowest health
  //               return context.attackTarget(target.id);
  //             }
  //             return false;
  //           }),
  //           new Action(() => {
  //             if (context.closestTarget) {
  //               return context.attackTarget(context.closestTarget.id);
  //             }
  //             return false;
  //           })
  //         )
  //       )
  //     )
  //   );
  // }

  execute(): boolean {
    return this.root.execute();
  }
}

// // Example Usage
// const context = new AIContext();
// context.threatTargets = [
//   { id: 1, threat: 100 },
//   { id: 2, threat: 80 },
// ];
// context.lowHealthTargets = [{ id: 3, health: 20 }];
// context.closestTarget = { id: 4 };

// const targetSelector = new AITargetSelector(context);
// targetSelector.execute();
