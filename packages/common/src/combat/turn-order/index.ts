export * from "./tick-combat-until-next-combatant-is-active";

export class CombatantTurnTracker {
  movement: number = 0;
  constructor(public entityId: string) {}
}
