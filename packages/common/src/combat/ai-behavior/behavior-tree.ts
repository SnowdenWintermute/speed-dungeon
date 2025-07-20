import { shuffleArray } from "../../utils";

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
export class SelectorNode implements BehaviorNode {
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
export class SequenceNode implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute() {
    for (const child of this.children) {
      const childState = child.execute();
      if (childState === BehaviorNodeState.Failure) return childState;
    }
    return BehaviorNodeState.Success;
  }
}

export class InverterNode implements BehaviorNode {
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

export class UntilFailNode implements BehaviorNode {
  constructor(private child: BehaviorNode) {}
  execute(): BehaviorNodeState {
    let lastExecutedState = BehaviorNodeState.Success;
    while (lastExecutedState !== BehaviorNodeState.Failure) {
      lastExecutedState = this.child.execute();
    }
    return lastExecutedState;
  }
}

export class SucceederNode implements BehaviorNode {
  constructor(private child?: BehaviorNode) {}
  execute() {
    if (this.child) {
      this.child.execute();
    }
    return BehaviorNodeState.Success;
  }
}

export class RandomizerNode<T> implements BehaviorNode {
  constructor(private array: Array<T>) {}
  execute(): BehaviorNodeState {
    shuffleArray(this.array);
    return BehaviorNodeState.Success;
  }
}

export class PopFromStackNode<T> implements BehaviorNode {
  constructor(
    private stack: T[],
    private setter: (value: T) => void
  ) {}
  execute(): BehaviorNodeState {
    const popped = this.stack.pop();
    if (popped === undefined) return BehaviorNodeState.Failure;

    this.setter(popped);
    return BehaviorNodeState.Success;
  }
}
