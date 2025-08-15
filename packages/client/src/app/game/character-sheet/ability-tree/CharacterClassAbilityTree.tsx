import { useGameStore } from "@/stores/game-store";
import {
  AbilityTree,
  AbilityType,
  COMBAT_ACTIONS,
  CombatActionName,
  CombatantAbilityProperties,
  ERROR_MESSAGES,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import { MenuStateType } from "../../ActionMenu/menu-state";
import { getAbilityIcon } from "./ability-icons";
import AbilityTreeButton from "./AbilityTreeButton";
import { useLayoutEffect, useRef, useState } from "react";

const ARROW_WIDTH = 5;
const ARROW_HEIGHT = 5;

export default function CharacterClassAbilityTree({ abilityTree }: { abilityTree: AbilityTree }) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const detailedAbilityOption = useGameStore.getState().detailedCombatantAbility;

  const actionCellRefs = useRef(new Map<CombatActionName, HTMLDivElement>());
  const svgRef = useRef<SVGSVGElement>(null);

  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantProperties } = focusedCharacterOption;

  const [positions, setPositions] = useState<Map<CombatActionName, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const measurePositions = () => {
      const newPositions = new Map<CombatActionName, DOMRect>();

      actionCellRefs.current.forEach((el, actionName) => {
        newPositions.set(actionName, el.getBoundingClientRect());
        setPositions(newPositions);
        // console.log(COMBAT_ACTION_NAME_STRINGS[actionName], {
        //   x: rect.left + rect.width / 2,
        //   y: rect.top + rect.height / 2,
        // });
      });
    };

    measurePositions();

    window.addEventListener("resize", measurePositions);
    return () => window.removeEventListener("resize", measurePositions);
  }, []);

  return (
    <div className="relative h-fit">
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 border"
      >
        {Array.from(positions.entries()).flatMap(([actionName, pos]) => {
          const action = COMBAT_ACTIONS[actionName];
          return action.prerequisiteAbilities?.map((prerequisite) => {
            if (prerequisite.type !== AbilityType.Action) return;
            // const from = positions.get(prerequisite.actionName);
            const svgRect = svgRef.current?.getBoundingClientRect();

            const from = positions.get(prerequisite.actionName);
            if (!from || !svgRect) return null;

            // const x1 =  from.left + from.width / 2 - svgRect.left;
            const x1 = from.x + from.width - svgRect.left;
            const y1 = from.bottom - svgRect.top;
            const x2 = pos.left + pos.width / 2 - svgRect.left;
            const y2 = pos.top - svgRect.top;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) return null; // avoid division by zero

            const shorten = ARROW_HEIGHT * 2; // or slightly less for padding
            const ratio = (distance - shorten) / distance;

            const x2Adjusted = x1 + dx * ratio;
            const y2Adjusted = y1 + dy * ratio;
            console.log("from:", from, "pos", pos);

            if (!from) return null;
            return (
              <line
                key={`${prerequisite.actionName}-${action.name}`}
                x1={x1}
                y1={y1}
                x2={x2Adjusted}
                y2={y2Adjusted}
                stroke="white"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          });
        })}
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
      </svg>

      <div
        className="absolute flex w-fit -right-2 -top-2 opacity-50 z-0"
        style={{ height: `calc(100% + 1rem)` }}
      >
        {abilityTree.columns.map((column, columnIndex) => {
          const shouldHighlight =
            currentMenu.type === MenuStateType.ConsideringAbilityTreeColumn &&
            currentMenu.page - 1 === columnIndex;
          return (
            <div
              key={columnIndex}
              className={`${shouldHighlight ? "bg-slate-800 " : ""} w-24 h-full`}
            >
              {column.map((ability, rowIndex) => {
                let highlightedStyle = "";
                if (detailedAbilityOption !== null && detailedAbilityOption === ability)
                  highlightedStyle = "bg-slate-800";

                return (
                  <div key={columnIndex + rowIndex} className={`h-24 w-full ${highlightedStyle}`} />
                );
              })}
            </div>
          );
        })}
      </div>
      <ul className="list-none flex relative top-0 left-0 z-10">
        {abilityTree.columns.map((column, columnIndex) => (
          <li key={"column" + columnIndex} className="mr-4 last:mr-0">
            <ul className="list-none">
              {column.map((ability, rowIndex) => {
                let cellContent = <div className="h-20 w-20"></div>;
                if (ability !== undefined) {
                  const abilityIconOption = getAbilityIcon(ability);
                  const abilityName = getAbilityTreeAbilityNameString(ability);
                  const buttonContent = abilityIconOption
                    ? abilityIconOption("h-full p-2 fill-slate-400")
                    : abilityName;

                  const isAllocatable = CombatantAbilityProperties.canAllocateAbilityPoint(
                    combatantProperties,
                    ability
                  );

                  cellContent = (
                    <div
                      ref={(el) => {
                        if (el && ability.type === AbilityType.Action)
                          actionCellRefs.current.set(ability.actionName, el);
                      }}
                    >
                      <AbilityTreeButton
                        focusedCharacterId={focusedCharacterOption.entityProperties.id}
                        ability={ability}
                        abilityLevel={CombatantAbilityProperties.getAbilityLevel(
                          combatantProperties,
                          ability
                        )}
                        buttonContent={buttonContent}
                        isAllocatable={isAllocatable.canAllocate}
                      />
                    </div>
                  );
                }

                return (
                  <li key={"column" + rowIndex + "row" + rowIndex} className="mb-4 last:mb-0 flex">
                    {columnIndex === 0 && (
                      <div className="mr-4 flex items-center">
                        <div>{(rowIndex + 1) * 2}</div>
                      </div>
                    )}
                    <div>{cellContent}</div>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
