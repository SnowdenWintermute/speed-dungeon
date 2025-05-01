import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { GameState } from "@/stores/game-store";
import {
  ACTION_PAYABLE_RESOURCE_STRINGS,
  ActionPayableResource,
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
  resourceType: ActionPayableResource,
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
    HP_CHANGE_SOURCE_CATEGORY_STRINGS[resourceChange.source.category].toLowerCase();

  let manaDamage = "";
  if (resourceType === ActionPayableResource.Mana) manaDamage = " mana";

  const resourceTypeString = ACTION_PAYABLE_RESOURCE_STRINGS[resourceType].toLowerCase();

  const damageText = `points of ${resourceChangeSourceCategoryText + kineticOptionString + elementOptionString}${manaDamage} damage`;

  const resourceTypeOrDamageText = resourceChange.value > 0 ? resourceTypeString : damageText;

  let style = CombatLogMessageStyle.Basic;
  if (resourceType === ActionPayableResource.HitPoints && resourceChange.value > 0)
    style = CombatLogMessageStyle.Healing;

  if (resourceType === ActionPayableResource.Mana && resourceChange.value > 0)
    style = CombatLogMessageStyle.Mana;

  let messageText = "";

  if (wasSpell) {
    const damagedOrHealed = resourceChange.value > 0 ? "recovers" : "takes";
    messageText = `${target.entityProperties.name} ${damagedOrHealed} ${Math.abs(resourceChange.value)} ${resourceTypeOrDamageText}`;
  } else {
    let recoveryWord = "healed";
    if (resourceType === ActionPayableResource.Mana) recoveryWord = "refreshed";
    const damagedOrHealed = resourceChange.value > 0 ? recoveryWord : "hit";

    const isTargetingSelf = actionUserId === target.entityProperties.id;
    const targetNameText = isTargetingSelf ? "themselves" : target.entityProperties.name;

    const debugTargetId = showDebug ? target.entityProperties.id : "";
    messageText = `${actionUserName} ${damagedOrHealed} ${targetNameText} ${debugTargetId} for ${Math.abs(resourceChange.value)} ${resourceTypeOrDamageText}`;
  }

  if (resourceChange.isCrit) messageText = "Critical! " + messageText;
  if (wasBlocked) messageText = "Shield block: " + messageText;

  gameState.combatLogMessages.push(new CombatLogMessage(messageText, style));
}
