export enum BehaviorNodeState {
  Failure,
  Success,
  Running,
}

export abstract class BehaviorNode {
  abstract execute(): BehaviorNodeState;
}

/** A behavior tree node that runs each child until reaching a success state.
 * If no child returns a success state, this node returns a failure state. */
export class Selector implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute() {
    for (const child of this.children) {
      if (child.execute()) return BehaviorNodeState.Success;
    }
    return BehaviorNodeState.Failure;
  }
}

/** A behavior tree node that runs each child until reaching a failure state.
 * Returns success if all children return success or running. */
export class Sequence implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute() {
    for (const child of this.children) {
      const childState = child.execute();
      if (childState === BehaviorNodeState.Failure) return childState;
    }
    return BehaviorNodeState.Success;
  }
}

export class Inverter implements BehaviorNode {
  constructor(private child: BehaviorNode) {}

  execute() {
    const childState = this.child.execute();
    switch (childState) {
      case BehaviorNodeState.Failure:
        return BehaviorNodeState.Success;
      case BehaviorNodeState.Success:
        return BehaviorNodeState.Failure;
      case BehaviorNodeState.Running:
        return BehaviorNodeState.Running;
    }
  }
}

export class Succeeder implements BehaviorNode {
  constructor(private child: BehaviorNode) {}
  execute() {
    this.child.execute();
    return BehaviorNodeState.Success;
  }
}
