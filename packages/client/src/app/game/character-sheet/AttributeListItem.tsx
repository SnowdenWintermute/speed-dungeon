import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CombatAttribute,
  ClientToServerEvent,
  formatCombatAttribute,
  getCombatAttributeDescription,
} from "@speed-dungeon/common";

interface Props {
  attribute: CombatAttribute;
  value: number;
  combatantHasUnspentAttributePoints: boolean;
  playerOwnsCharacter: boolean;
  showAttributeAssignmentButtonsIfOwned: boolean;
}

export function AttributeListItem(props: Props) {
  const consideredItemUnmetRequirements = useGameStore().consideredItemUnmetRequirements;
  const isUnmetRequirement = consideredItemUnmetRequirements?.includes(props.attribute);
  const highlightClass = isUnmetRequirement ? UNMET_REQUIREMENT_TEXT_COLOR : "";

  const shouldShowIncreaseAttributeButton =
    props.combatantHasUnspentAttributePoints &&
    ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(props.attribute) &&
    props.playerOwnsCharacter &&
    props.showAttributeAssignmentButtonsIfOwned;

  return (
    <li className={`flex justify-between ${highlightClass}`}>
      <span className="flex">
        <span className="inline-block h-6 w-6 whitespace-nowrap text-ellipsis overflow-hidden">
          <HoverableTooltipWrapper tooltipText={getCombatAttributeDescription(props.attribute)}>
            <span className="cursor-help h-full w-full inline-block">{"ⓘ "}</span>
          </HoverableTooltipWrapper>
        </span>
        {formatCombatAttribute(props.attribute)}
      </span>
      <span>
        <span>{Math.floor(props.value)}</span>
        {shouldShowIncreaseAttributeButton && (
          <IncreaseAttributeButton attribute={props.attribute} />
        )}
      </span>
    </li>
  );
}

function IncreaseAttributeButton({ attribute }: { attribute: CombatAttribute }) {
  const socketOption = websocketConnection;
  const focusedCharacterId = useGameStore().focusedCharacterId;

  function handleClick() {
    socketOption?.emit(ClientToServerEvent.IncrementAttribute, focusedCharacterId, attribute);
  }

  return (
    <button
      onClick={handleClick}
      className="inline-block h-4 w-4 border border-slate-400 text-lg leading-3 ml-2"
    >
      {"+"}
    </button>
  );
}
