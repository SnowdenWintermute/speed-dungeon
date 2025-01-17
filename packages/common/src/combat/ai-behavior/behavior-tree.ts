import { CombatAction } from "../index.js";
import { EntityId } from "../../primatives/index.js";

export interface BehaviorNode {
  execute(): boolean;
}

export class Selector implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (child.execute()) return true;
    }
    return false;
  }
}

export class Sequence implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (!child.execute()) return false;
    }
    return true;
  }
}

export class BehaviorLeaf implements BehaviorNode {
  constructor(public execute: (...args: any[]) => boolean) {}
}

export class Inverter implements BehaviorNode {
  constructor(private child: BehaviorNode) {}

  execute(): boolean {
    return !this.child.execute();
  }
}

export class Succeeder implements BehaviorNode {
  constructor(private child: BehaviorNode) {}
  execute(): boolean {
    return true;
  }
}

export class RepeatUntilFail implements BehaviorNode {
  constructor(private children: BehaviorNode[]) {}

  execute(): boolean {
    for (const child of this.children) {
      if (!child.execute()) return false;
    }
    return this.execute();
  }
}
