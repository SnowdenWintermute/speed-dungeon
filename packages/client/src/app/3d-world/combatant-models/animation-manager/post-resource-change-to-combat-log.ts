import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { GameState } from "@/stores/game-store";
import {
  Combatant,
  EntityId,
  HP_CHANGE_SOURCE_CATEGORY_STRINGS,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
  ResourceChange,
} from "@speed-dungeon/common";

export function postResourceChangeToCombatLog(
  gameState: GameState,
  resourceChange: ResourceChange,
  wasSpell: boolean,
  wasBlocked: boolean,
  target: Combatant,
  actionUserName: string,
  actionUserId: EntityId,
  showDebug: boolean
) {
  const { elementOption, kineticDamageTypeOption } = resourceChange.source;

  let elementOptionString: string = "";
  if (elementOption !== undefined)
    elementOptionString = ` ${MAGICAL_ELEMENT_STRINGS[elementOption].toLowerCase()}`;

  let kineticOptionString = "";
  if (kineticDamageTypeOption !== undefined)
    kineticOptionString = ` ${KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption].toLowerCase()}`;

  const resourceChangeSourceCategoryText =
    HP_CHANGE_SOURCE_CATEGORY_STRINGS[resourceChange.source.category];

  const damageText = `points of ${resourceChangeSourceCategoryText + kineticOptionString + elementOptionString} damage`;
  const hpOrDamage = resourceChange.value > 0 ? "hit points" : damageText;

  const style =
    resourceChange.value > 0 ? CombatLogMessageStyle.Healing : CombatLogMessageStyle.Basic;
  let messageText = "";

  if (wasSpell) {
    const damagedOrHealed = resourceChange.value > 0 ? "recovers" : "takes";
    messageText = `${target.entityProperties.name} ${damagedOrHealed} ${Math.abs(resourceChange.value)} ${hpOrDamage}`;
  } else {
    const damagedOrHealed = resourceChange.value > 0 ? "healed" : "hit";

    const isTargetingSelf = actionUserId === target.entityProperties.id;
    console.log("action user id: ", actionUserId, target.entityProperties.id);
    const targetNameText = isTargetingSelf ? "themselves" : target.entityProperties.name;

    const debugTargetId = showDebug ? target.entityProperties : "";
    messageText = `${actionUserName} ${damagedOrHealed} ${targetNameText} ${debugTargetId} for ${Math.abs(resourceChange.value)} ${hpOrDamage}`;
  }

  if (resourceChange.isCrit) messageText = "Critical! " + messageText;
  if (wasBlocked) messageText = "Shield block: " + messageText;

  gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
}
