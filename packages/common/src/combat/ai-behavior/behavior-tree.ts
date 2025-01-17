// from chat-gpt

// Define the Node interface for all behavior tree nodes
interface BehaviorNode {
  execute(): boolean; // Returns true if the node succeeds, false if it fails
}

// Composite node: Selector (tries child nodes until one succeeds)
class Selector implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (child.execute()) return true; // Stop on the first success
    }
    return false; // No child succeeded
  }
}

// Composite node: Sequence (tries child nodes until one fails)
class Sequence implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (!child.execute()) return false; // Stop on the first failure
    }
    return true; // No child failed
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
class Action implements BehaviorNode {
  constructor(private action: () => boolean) {}

  execute(): boolean {
    return this.action();
  }
}

// Example AI context
class AIContext {
  public offensive: boolean = true;
  public threatTargets: { id: number; threat: number }[] = [];
  public lowHealthTargets: { id: number; health: number }[] = [];
  public closestTarget: { id: number } | null = null;

  // Simulates an attack action
  attackTarget(targetId: number): boolean {
    console.log(`Attacking target with ID: ${targetId}`);
    return true;
  }
}

// Example Behavior Tree for Target Selection
class AITargetSelector {
  private root: BehaviorNode;

  constructor(context: AIContext) {
    this.root = new Selector(
      new Sequence(
        new Condition(
          () => context.offensive,
          new Selector(
            new Action(() => {
              if (context.threatTargets.length > 0) {
                const target = context.threatTargets[0]; // Example logic: pick the highest threat
                return context.attackTarget(target.id);
              }
              return false;
            }),
            new Action(() => {
              if (context.lowHealthTargets.length > 0) {
                const target = context.lowHealthTargets[0]; // Example logic: pick the lowest health
                return context.attackTarget(target.id);
              }
              return false;
            }),
            new Action(() => {
              if (context.closestTarget) {
                return context.attackTarget(context.closestTarget.id);
              }
              return false;
            })
          )
        )
      )
    );
  }

  execute(): boolean {
    return this.root.execute();
  }
}

// Example Usage
const context = new AIContext();
context.threatTargets = [
  { id: 1, threat: 100 },
  { id: 2, threat: 80 },
];
context.lowHealthTargets = [{ id: 3, health: 20 }];
context.closestTarget = { id: 4 };

const targetSelector = new AITargetSelector(context);
targetSelector.execute();
