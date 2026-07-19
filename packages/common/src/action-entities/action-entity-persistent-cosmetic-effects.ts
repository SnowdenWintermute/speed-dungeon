import { getFirewallCosmeticEffectsToStart } from "../combat/combat-actions/action-implementations/firewall/firewall-cosmetic-effects.js";
import { CosmeticEffectOnTargetTransformNode } from "../combat/combat-actions/combat-action-steps-config.js";
import { ActionEntity, ActionEntityName } from "./index.js";

// cosmetic effects that must exist for as long as an action entity does, derived from its durable
// state. during live play these are started/stopped by replay commands, but a GameFullUpdate (e.g.
// reconnection) re-deserializes the entity without replaying the action that started them, so the
// client uses this to restore them from the entity itself.
export function getActionEntityPersistentCosmeticEffects(
  actionEntity: ActionEntity
): CosmeticEffectOnTargetTransformNode[] {
  switch (actionEntity.actionEntityProperties.name) {
    case ActionEntityName.Firewall:
      return getFirewallCosmeticEffectsToStart(actionEntity);
    default:
      return [];
  }
}
