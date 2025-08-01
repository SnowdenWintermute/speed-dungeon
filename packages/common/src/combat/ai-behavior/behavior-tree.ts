import { shuffleArray } from "../../utils/index.js";

export enum BehaviorNodeState {
  Failure,
  Success,
  Running,
}

export const BEHAVIOR_NODE_STATE_STRINGS: Record<BehaviorNodeState, string> = {
  [BehaviorNodeState.Failure]: "Failure",
  [BehaviorNodeState.Success]: "Success",
  [BehaviorNodeState.Running]: "Running",
};

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
    return BehaviorNodeState.Success;
  }
}

export class UntilSuccessNode implements BehaviorNode {
  private attempts = 0;
  constructor(
    private child: BehaviorNode,
    private options?: { maxAttemptsGetter?: () => number }
  ) {}
  execute(): BehaviorNodeState {
    let lastExecutedState = BehaviorNodeState.Failure;
    const maxAttempts = this.options?.maxAttemptsGetter ? this.options?.maxAttemptsGetter() : null;
    while (lastExecutedState !== BehaviorNodeState.Success) {
      lastExecutedState = this.child.execute();
      if (typeof maxAttempts === "number" && this.attempts >= maxAttempts) break;
      this.attempts += 1;
    }

    return BehaviorNodeState.Success;
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
  constructor(private arrayOptionGetter: () => undefined | Array<T>) {}
  execute(): BehaviorNodeState {
    const arrayOption = this.arrayOptionGetter();
    if (arrayOption === undefined) return BehaviorNodeState.Failure;
    shuffleArray(arrayOption);
    return BehaviorNodeState.Success;
  }
}

export class SorterNode<T> implements BehaviorNode {
  constructor(
    private arrayOptionGetter: () => undefined | Array<T>,
    private sortingFunction: (a: T, b: T) => number
  ) {}
  execute(): BehaviorNodeState {
    const arrayOption = this.arrayOptionGetter();
    if (arrayOption === undefined) return BehaviorNodeState.Failure;
    arrayOption.sort(this.sortingFunction);
    return BehaviorNodeState.Success;
  }
}

export class PopFromStackNode<T> implements BehaviorNode {
  constructor(
    private stackGetter: () => T[],
    private setter: (value: T) => void
  ) {}
  execute(): BehaviorNodeState {
    const popped = this.stackGetter().pop();
    if (popped === undefined) return BehaviorNodeState.Failure;

    this.setter(popped);
    return BehaviorNodeState.Success;
  }
}
