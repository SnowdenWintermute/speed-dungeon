import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

export class IronmanModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override async onFloorDescent(): Promise<void> {
    // - save the "ironman party ladder record" with Players and characters
    //   {name:EntityName,combatantClass: CombatantClass,experience: number }[]
    // - add an "ironman ladder floor reached" in x ms record referencing the party id
    // - update the ironman party ladder record to reference the new "floor reached record"
    // - create and link a similar "time spent on floor" record
    // - update the player's profiles to reference the "ironman ladder party record"
    throw new Error("Method not implemented.");
  }

  override async onPartyEscape(): Promise<void> {
    // save a "run completed" ladder record with any interesting metadata
    throw new Error("Method not implemented.");
  }
}
