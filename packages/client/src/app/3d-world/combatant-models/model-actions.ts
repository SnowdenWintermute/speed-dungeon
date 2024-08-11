export enum CombatantModelAction {
  ApproachDestination,
  ReturnHome,
  Recenter,
  TurnToFaceTarget,
  AttackMeleeMainHand,
  AttackMeleeOffHand,
  AttackRanged,
  UseConsumable,
  CastSpell,
  HitRecovery,
  Evade,
  Death,
  Idle,
  EndTurn,
}

export class CombatantModelActionProgressTracker {
  timeStarted: number = Date.now();
  transitionStarted: null | number = null;
  constructor() {}
}
