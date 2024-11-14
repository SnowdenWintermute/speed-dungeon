import { BUTTON_HEIGHT, SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import React, { useRef } from "react";
import { useGameStore } from "@/stores/game-store";
import TopButton from "./action-menu-buttons/TopButton";
import NumberedButton from "./action-menu-buttons/NumberedButton";
import { ActionButtonCategory } from "./menu-state";
import ActionDetails from "../detailables/ActionDetails";
import { ConsideringCombatActionMenuState } from "./menu-state/considering-combat-action";

export const ACTION_MENU_PAGE_SIZE = 6;
const topButtoLiStyle = { marginRight: `${SPACING_REM}rem` };

export default function ActionMenu({ inputLocked }: { inputLocked: boolean }) {
  const actionMenuRef = useRef<HTMLUListElement>(null);
  const combatantModelsAwaitingSpawn = useGameStore((state) => state.combatantModelsAwaitingSpawn);
  const hoveredAction = useGameStore((state) => state.hoveredAction);
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const buttonProperties = currentMenu.getButtonProperties();

  if (inputLocked) return <div />;
  if (combatantModelsAwaitingSpawn.length)
    <div>Awating spawn of {combatantModelsAwaitingSpawn.length} models...</div>;

  let selectedActionDisplay = <></>;
  if (currentMenu instanceof ConsideringCombatActionMenuState) {
    selectedActionDisplay = (
      <div
        className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2"
        style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
      >
        <ActionDetails combatAction={currentMenu.combatAction} hideTitle={false} />
      </div>
    );
  }

  let hoveredActionDisplay = <></>;
  if (hoveredAction) {
    hoveredActionDisplay = (
      <div className="absolute top-0 left-full pl-2">
        <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2">
          <ActionDetails combatAction={hoveredAction} hideTitle={false} />
        </div>
      </div>
    );
  }

  return (
    <section
      className={`max-h-fit max-w-[25rem] flex flex-col justify-between`}
      style={{ marginRight: `${SPACING_REM}rem` }}
    >
      <ul
        className={`flex list-none min-w-[25rem] max-w-[25rem]`}
        style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
      >
        {buttonProperties[ActionButtonCategory.Top].map((button, i) => {
          const thisButtonProperties = buttonProperties[ActionButtonCategory.Top][i]!;
          // the key for this li is like that because just switching based on text won't update
          // when two different actions with "cancel" text are switched
          // @TODO - find out if that is still true in the new state pattern based menu creation
          return (
            <li key={thisButtonProperties.text + i} style={topButtoLiStyle}>
              <TopButton properties={button}></TopButton>
            </li>
          );
        })}
      </ul>
      <div
        className={`mb-2`}
        style={{
          height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem`,
        }}
      >
        <ul className="list-none relative pointer-events-auto" ref={actionMenuRef}>
          {buttonProperties[ActionButtonCategory.Numbered].map((button, i) => (
            <li key={button.text + i}>
              <NumberedButton number={i + 1} properties={button} />
            </li>
          ))}
          {selectedActionDisplay}
          {hoveredActionDisplay}
        </ul>
      </div>
      <div>
        {buttonProperties[ActionButtonCategory.Bottom].map((button) => (
          <li key={button.text}>
            <TopButton properties={button} />
          </li>
        ))}
        Current Page: {currentMenu.page}/{currentMenu.numPages}
      </div>
    </section>
  );
}

// const [buttonProperties, setButtonProperties] = useState<
//   Record<ActionButtonCategory, ActionMenuButtonProperties[]>
// >({
//   [ActionButtonCategory.Top]: [],
//   [ActionButtonCategory.Numbered]: [],
//   [ActionButtonCategory.NextPrevious]: [],
// });
// const [numberOfPages, setNumberOfPages] = useState(1);

// const buttonsByCategory = createActionMenuButtons(buttonProperties);

// function handleWheel() {}

// let hoveredActionDisplay = <></>;
// if (gameState.hoveredAction) {
//   hoveredActionDisplay = (
//     <div className="absolute top-0 left-full pl-2">
//       <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2">
//         <ActionDetails combatAction={gameState.hoveredAction} hideTitle={false} />
//       </div>
//     </div>
//   );
// }

// let selectedActionDisplay = <></>;
// const focusedCharacterResult = useGameStore().getFocusedCharacter();
// if (!(focusedCharacterResult instanceof Error)) {
//   const selectedCombatActionOption =
//     focusedCharacterResult.combatantProperties.selectedCombatAction;
//   if (selectedCombatActionOption) {
//     selectedActionDisplay = (
//       <div
//         className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2"
//         style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
//       >
//         <ActionDetails combatAction={selectedCombatActionOption} hideTitle={false} />
//       </div>
//     );
//   }
// }

// if (inputLocked) return <div />;

// return (
//   <section
//     className={`max-h-fit max-w-[25rem] flex flex-col justify-between`}
//     style={{ marginRight: `${SPACING_REM}rem` }}
//   >
//     <ActionMenuChangeDetectionHandler
//       setButtonProperties={setButtonProperties}
//       setNumberOfPages={setNumberOfPages}
//     />
//     <ul
//       className={`flex list-none min-w-[25rem] max-w-[25rem]`}
//       style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
//     >
//       {buttonsByCategory.top.map((button, i) => {
//         const thisButtonProperties = buttonProperties[ActionButtonCategory.Top][i]!;
//         // the key for this li is like that because just switching based on text won't update
//         // when two different actions with "cancel" text are switched
//         return (
//           <li
//             key={JSON.stringify(thisButtonProperties.action) + thisButtonProperties.text + i}
//             style={{ marginRight: `${SPACING_REM}rem` }}
//           >
//             {button}
//           </li>
//         );
//       })}
//     </ul>
//     <div className={`mb-2`} style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}>
//       <ul
//         className="list-none relative pointer-events-auto"
//         ref={actionMenuRef}
//         onWheel={handleWheel}
//       >
//         {buttonsByCategory.numbered.map((button, i) => (
//           <li key={buttonProperties[ActionButtonCategory.Numbered][i]!.text + i}>{button}</li>
//         ))}
//         {hoveredActionDisplay}
//         {selectedActionDisplay}
//       </ul>
//     </div>

//     {Object.values(buttonsByCategory.nextPrev).length > 0 ? (
//       <ChangeTargetButtons>{buttonsByCategory.nextPrev}</ChangeTargetButtons>
//     ) : (
//       <PageTurningButtons numberOfPages={numberOfPages} hidden={numberOfPages < 2} />
//     )}
//   </section>
// );
