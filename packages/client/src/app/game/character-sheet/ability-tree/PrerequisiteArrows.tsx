import { AbilityTreeAbility, AbilityUtils } from "@speed-dungeon/common";
import React, { RefObject, useLayoutEffect, useRef, useState } from "react";

const ARROW_WIDTH = 5;
const ARROW_HEIGHT = 5;

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
  useLayoutEffect(() => {
    const measurePositions = () => {
      const newPositions = new Map<string, DOMRect>();

      for (const [abilityString, { element, prerequisites }] of Object.entries(cellRefs.current)) {
        newPositions.set(abilityString, element.getBoundingClientRect());
        setPositions(newPositions);
      }
    };

    measurePositions();

    window.addEventListener("resize", measurePositions);
    return () => window.removeEventListener("resize", measurePositions);
  }, []);

  return (
    <svg
      ref={svgRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 border"
    >
      {Array.from(positions.entries()).flatMap(([abilityName, cellRect]) => {
        const prerequisites = cellRefs.current[abilityName]?.prerequisites;
        if (prerequisites === undefined) return;
        return prerequisites.map((prerequisite) => (
          <ArrowLine
            positions={positions}
            prerequisite={prerequisite}
            svgRef={svgRef}
            cellRect={cellRect}
            abilityName={abilityName}
          />
        ));
      })}
      <ArrowHead />
    </svg>
  );
}

function ArrowLine({
  positions,
  prerequisite,
  svgRef,
  cellRect,
  abilityName,
}: {
  positions: Map<string, DOMRect>;
  prerequisite: AbilityTreeAbility;
  svgRef: React.RefObject<SVGSVGElement | null>;
  cellRect: DOMRect;
  abilityName: string;
}) {
  const svgRect = svgRef.current?.getBoundingClientRect();

  const prerequisiteStringName = AbilityUtils.getStringName(prerequisite);
  const from = positions.get(prerequisiteStringName);
  if (!from || !svgRect) return null;

  // const x1 =  from.left + from.width / 2 - svgRect.left;
  const x1 = from.x + from.width - svgRect.left;
  const y1 = from.bottom - svgRect.top;
  const x2 = cellRect.left + cellRect.width / 2 - svgRect.left;
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
      key={`${prerequisiteStringName}-${abilityName}`}
      x1={x1}
      y1={y1}
      x2={x2Adjusted}
      y2={y2Adjusted}
      stroke="white"
      strokeWidth="2"
      markerEnd="url(#arrowhead)"
    />
  );
}

function ArrowHead() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth={ARROW_WIDTH}
        markerHeight={ARROW_HEIGHT}
        refX={0} // 10% from base
        refY={ARROW_HEIGHT / 2} // vertical center
        orient="auto"
      >
        <polygon
          points={`0 0, ${ARROW_WIDTH} ${ARROW_HEIGHT / 2}, 0 ${ARROW_HEIGHT}`}
          fill="white"
        />
      </marker>
    </defs>
  );
}
