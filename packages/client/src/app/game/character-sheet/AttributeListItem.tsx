import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CombatAttribute,
  ClientToServerEvent,
  COMBAT_ATTRIBUTE_DESCRIPTIONS,
  COMBAT_ATTRIBUTE_STRINGS,
  CORE_ATTRIBUTES,
  INFO_UNICODE_SYMBOL,
} from "@speed-dungeon/common";
import StarShape from "../../../../public/img/basic-shapes/star.svg";
import { AppStore } from "@/mobx-stores/app-store";

interface Props {
  attribute: CombatAttribute;
  value: number;
  combatantHasUnspentAttributePoints: boolean;
  playerOwnsCharacter: boolean;
  showAttributeAssignmentButtonsIfOwned: boolean;
}

export function AttributeListItem(props: Props) {
  const consideredItemUnmetRequirements =
    AppStore.get().focusStore.getSelectedItemUnmetRequirements();
  const isUnmetRequirement = consideredItemUnmetRequirements.has(props.attribute);
  let highlightClass = isUnmetRequirement ? UNMET_REQUIREMENT_TEXT_COLOR : "";

  const shouldShowIncreaseAttributeButton =
    props.combatantHasUnspentAttributePoints &&
    ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(props.attribute) &&
    props.playerOwnsCharacter &&
    props.showAttributeAssignmentButtonsIfOwned;

  const isCoreAttribute = CORE_ATTRIBUTES.includes(props.attribute);

  const infoIcon = isCoreAttribute ? (
    <div className="mr-2 h-4 w-4">
      <StarShape className="fill-slate-400 h-full w-full" />
    </div>
  ) : (
    INFO_UNICODE_SYMBOL
  );

  const tooltipCoreAttributeText = isCoreAttribute ? "[Core Attribute] " : "";

  return (
    <li className={`flex justify-between ${highlightClass} `}>
      <span className="flex">
        <span className="inline-block h-6 w-6 whitespace-nowrap text-ellipsis overflow-hidden">
          <HoverableTooltipWrapper
            tooltipText={tooltipCoreAttributeText + COMBAT_ATTRIBUTE_DESCRIPTIONS[props.attribute]}
          >
            <span className="cursor-help h-full w-full inline-block">{infoIcon}</span>
          </HoverableTooltipWrapper>
        </span>
        {COMBAT_ATTRIBUTE_STRINGS[props.attribute]}
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
    socketOption?.emit(ClientToServerEvent.IncrementAttribute, {
      characterId: focusedCharacterId,
      attribute,
    });
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
