// import { DurabilityChangesByEntityId } from "../../action-processing/durability-changes.js";
// import { CombatActionName } from "../combat-actions/combat-action-names.js";
// import { ResourceChangeSource } from "../hp-change-source-types.js";
// import { CombatActionTarget } from "../targeting/combat-action-targets.js";

// // @TODO @PERF - change from null to option properties so we don't send the key names in the packets
// export class ActionResult {
//   hitPointChangesByEntityId: null | {
//     [entityId: string]: { source: ResourceChangeSource; value: number };
//   } = null;
//   manaChangesByEntityId: null | { [entityId: string]: number } = null;
//   manaCost: number = 0;
//   missesByEntityId: null | string[] = null;
//   critsByEntityId: null | string[] = null;
//   itemIdsConsumed: string[] = [];
//   endsTurn: boolean = true;
//   targetIds: string[] = [];
//   durabilityChanges?: DurabilityChangesByEntityId;
//   constructor(
//     public userId: string,
//     public actionName: CombatActionName,
//     public target: CombatActionTarget
//   ) {}
// }
