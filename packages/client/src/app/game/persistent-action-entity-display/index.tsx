import { ACTION_ENTITY_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { useGameStore } from "@/stores/game-store";
import { ACTION_ENTITY_STRINGS, ActionEntity } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

export default function PersistentActionEntityDisplay() {
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const party = partyResult;

  const game = useGameStore().game;
  if (game === null) return <div>no game</div>;
  const { actionEntityManager } = party;

  return (
    <ul className="list-none">
      {Object.entries(actionEntityManager.getActionEntities()).map(
        ([actionEntityId, actionEntity]) => (
          <ul key={actionEntityId}>
            <PersistentActionEntity actionEntity={actionEntity} />
          </ul>
        )
      )}
    </ul>
  );
}

const PersistentActionEntity = observer(({ actionEntity }: { actionEntity: ActionEntity }) => {
  const { actionOriginData } = actionEntity.actionEntityProperties;
  if (actionOriginData === undefined) return <div></div>;

  const { actionLevel, stacks } = actionOriginData;

  const { name } = actionEntity.actionEntityProperties;

  const iconGetterOption = ACTION_ENTITY_ICONS[name];
  let icon = <div></div>;
  if (iconGetterOption !== null) {
    icon = (
      <div className="h-full p-1 filter brightness-125 contrast-50">
        {iconGetterOption("h-full")}
      </div>
    );
  }

  const showDebug = AppStore.get().dialogStore.isOpen(DialogElementName.Debug);

  return (
    <div className="h-20 w-20 border-2 border-slate-400 relative bg-slate-800 text-zinc-300 pointer-events-auto">
      <div className="absolute h-full p-1">{icon}</div>
      <div
        className="absolute h-full p-1 text-sm flex flex-col text-center justify-end w-full"
        style={{
          textShadow: "2px 2px 0px #000000",
        }}
      >
        <div className="text-center w-full">{ACTION_ENTITY_STRINGS[name]}</div>
        <div className="w-full text-center">
          R:{actionLevel?.current || 0} S:{stacks?.current || 0}
        </div>
        {showDebug && (
          <div className="absolute top-full left-1/2 -translate-x-1/2">
            {actionEntity.entityProperties.id}
          </div>
        )}
      </div>
    </div>
  );
});
