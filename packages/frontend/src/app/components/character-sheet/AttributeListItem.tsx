import HoverableTooltipWrapper from "@speed-dungeon/ui/atoms/HoverableTooltipWrapper";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";
import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CombatAttribute,
  COMBAT_ATTRIBUTE_DESCRIPTIONS,
  COMBAT_ATTRIBUTE_STRINGS,
  CORE_ATTRIBUTES,
  INFO_UNICODE_SYMBOL,
  AttributePointAssignableAttributes,
} from "@speed-dungeon/common";
import StarShape from "../../../../public/img/basic-shapes/star.svg";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useCharacterSheetSubject } from "./character-sheet-subject-context";
import { observer } from "mobx-react-lite";

interface Props {
  attribute: CombatAttribute;
  value: number;
  combatantHasUnspentAttributePoints: boolean;
  onAllocatePointOption: null | ((attribute: CombatAttribute) => void);
}

export const AttributeListItem = observer((props: Props) => {
  const { detailableEntityFocus } = useClientApplication();
  const subject = useCharacterSheetSubject();
  const consideredItemUnmetRequirements = detailableEntityFocus.getSelectedItemUnmetRequirements(
    subject.combatant
  );

  const isUnmetRequirement = consideredItemUnmetRequirements.has(props.attribute);

  const highlightClass = isUnmetRequirement ? UNMET_REQUIREMENT_TEXT_COLOR : "";

  const shouldShowIncreaseAttributeButton =
    props.combatantHasUnspentAttributePoints &&
    ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(
      props.attribute as AttributePointAssignableAttributes
    ) &&
    props.onAllocatePointOption !== null;

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
        {shouldShowIncreaseAttributeButton && props.onAllocatePointOption !== null && (
          <IncreaseAttributeButton
            attribute={props.attribute}
            onAllocatePoint={props.onAllocatePointOption}
          />
        )}
      </span>
    </li>
  );
});

const IncreaseAttributeButton = observer(
  ({
    attribute,
    onAllocatePoint,
  }: {
    attribute: CombatAttribute;
    onAllocatePoint: (attribute: CombatAttribute) => void;
  }) => {
    return (
      <button
        onClick={() => onAllocatePoint(attribute)}
        className="inline-block h-4 w-4 border border-slate-400 text-lg leading-3 ml-2"
      >
        {"+"}
      </button>
    );
  }
);
