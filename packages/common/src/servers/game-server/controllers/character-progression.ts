import { clear } from "node:console";
import { AbilityTreeAbility } from "../../../abilities/index.js";
import { CombatantId } from "../../../aliases.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";

export class CharacterProgressionController {
  constructor(private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>) {}

  characterSpentAttributePointHandler(
    session: UserSession,
    data: { characterId: CombatantId; attribute: CombatAttribute }
  ) {
    const { characterId, attribute } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);
    const { combatantProperties } = character;

    combatantProperties.attributeProperties.requireUnspentAttributes();
    combatantProperties.attributeProperties.requireAttributeAllocatable(attribute);
    combatantProperties.attributeProperties.allocatePoint(attribute);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterSpentAttributePoint,
      data,
    });

    return outbox;
  }

  characterAllocatedAbilityPointHandler(
    session: UserSession,
    data: { characterId: CombatantId; ability: AbilityTreeAbility }
  ) {
    const { characterId, ability } = data;
    const { game, party, character } = session.requireCharacterContext(characterId);
    const { combatantProperties } = character;

    const { canAllocate, reasonCanNot } =
      combatantProperties.abilityProperties.canAllocateAbilityPoint(ability);
    if (!canAllocate) {
      throw new Error(reasonCanNot);
    }

    combatantProperties.abilityProperties.allocateAbilityPoint(ability);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterAllocatedAbilityPoint,
      data,
    });

    return outbox;
  }
}
