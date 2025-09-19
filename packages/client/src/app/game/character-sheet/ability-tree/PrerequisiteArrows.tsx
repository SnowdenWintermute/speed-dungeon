import { MAIN_TEXT_AND_BORDERS_COLOR } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import {
  AbilityTreeAbility,
  AbilityUtils,
  CombatantAbilityProperties,
  CombatantProperties,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import React, { RefObject, useLayoutEffect, useRef, useState } from "react";

const ARROW_WIDTH = 5;
const ARROW_HEIGHT = 5;

const PREREQ_LINE_COLORS = [MAIN_TEXT_AND_BORDERS_COLOR, "lightgrey", "white"];

interface Props {
  cellRefs: RefObject<
    Record<
      string,
      {
        element: HTMLDivElement;
        prerequisites: AbilityTreeAbility[];
      }
    >
  >;
}

export default function PrerequisiteArrows(props: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Map<string, DOMRect>>(new Map());

  const { cellRefs } = props;

  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantProperties } = focusedCharacterOption;

  useLayoutEffect(() => {
    const measurePositions = () => {
      const newPositions = new Map<string, DOMRect>();

      for (const [abilityString, { element, prerequisites }] of Object.entries(cellRefs.current)) {
        newPositions.set(abilityString, element.getBoundingClientRect());
      }

      setPositions(newPositions);
    };

    measurePositions();

    window.addEventListener("resize", measurePositions);
    return () => window.removeEventListener("resize", measurePositions);
  }, [focusedCharacterOption.entityProperties.id]);

  return (
    <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
      {Array.from(positions.entries()).flatMap(([abilityAsJson, cellRect]) => {
        const prerequisites = cellRefs.current[abilityAsJson]?.prerequisites;
        if (prerequisites === undefined) return;

        const ability: AbilityTreeAbility = JSON.parse(abilityAsJson);

        const characterOwnsAbility = CombatantAbilityProperties.getAbilityLevel(
          combatantProperties,
          ability
        );

        let characterOwnsPrerequisites = true;
        for (const prerequisite of prerequisites) {
          const characterOwnsPrerequisite = CombatantAbilityProperties.getAbilityLevel(
            combatantProperties,
            prerequisite
          );
          if (!characterOwnsPrerequisite) {
            characterOwnsPrerequisites = false;
            break;
          }
        }

        let color = MAIN_TEXT_AND_BORDERS_COLOR;
        let opacity = 50;
        if (characterOwnsPrerequisites) opacity = 100;
        if (characterOwnsAbility) color = "white";

        return prerequisites.map((prerequisite) => (
          <ArrowLine
            key={`${abilityAsJson}-${AbilityUtils.getStringName(prerequisite)}`}
            positions={positions}
            prerequisite={prerequisite}
            svgRef={svgRef}
            cellRect={cellRect}
            color={color}
            opacity={opacity}
          />
        ));
      })}

      <defs>
        {PREREQ_LINE_COLORS.map((color) => (
          <ArrowHead color={color} key={"arrow-head-" + color} />
        ))}
      </defs>
    </svg>
  );
}

const TOLERANCE = 3;

function ArrowLine({
  positions,
  prerequisite,
  svgRef,
  cellRect,
  color,
  opacity,
}: {
  positions: Map<string, DOMRect>;
  prerequisite: AbilityTreeAbility;
  svgRef: React.RefObject<SVGSVGElement | null>;
  cellRect: DOMRect;
  color: string;
  opacity: number;
}) {
  const svgRect = svgRef.current?.getBoundingClientRect();

  const prerequisiteStringName = JSON.stringify(prerequisite);
  const from = positions.get(prerequisiteStringName);
  if (!from || !svgRect) return null;

  let fromX = from.left + from.width / 2;
  let toX = cellRect.left + cellRect.width / 2;

  const diffX = from.x - cellRect.x;
  if (diffX < -TOLERANCE) {
    // from is to the left of to
    fromX = from.right;
    toX = cellRect.left;
  } else if (diffX > TOLERANCE) {
    // from is to the right of to
    fromX = from.left;
    toX = cellRect.right;
  }

  // const x1 =  from.left + from.width / 2 - svgRect.left;
  const x1 = fromX - svgRect.left;
  const y1 = from.bottom - svgRect.top;
  const x2 = toX - svgRect.left;
  const y2 = cellRect.top - svgRect.top;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return null; // avoid division by zero

  const shorten = ARROW_HEIGHT * 2; // or slightly less for padding
  const ratio = (distance - shorten) / distance;

  const x2Adjusted = x1 + dx * ratio;
  const y2Adjusted = y1 + dy * ratio;

  if (!from) return null;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2Adjusted}
      y2={y2Adjusted}
      stroke={color}
      strokeWidth="2"
      markerEnd={`url(#arrowhead-${color})`}
      style={{ opacity: `${opacity}%` }}
    />
  );
}

function ArrowHead({ color }: { color: string }) {
  return (
    <marker
      id={`arrowhead-${color}`}
      markerWidth={ARROW_WIDTH}
      markerHeight={ARROW_HEIGHT}
      refX={0} // 10% from base
      refY={ARROW_HEIGHT / 2} // vertical center
      orient="auto"
    >
      <polygon points={`0 0, ${ARROW_WIDTH} ${ARROW_HEIGHT / 2}, 0 ${ARROW_HEIGHT}`} fill={color} />
    </marker>
  );
}
