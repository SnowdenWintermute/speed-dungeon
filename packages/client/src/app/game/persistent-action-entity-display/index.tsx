import { useGameStore } from "@/stores/game-store";
import { ACTION_ENTITY_STRINGS, ActionEntity } from "@speed-dungeon/common";
import React from "react";

interface Props {}

export default function PersistentActionEntityDisplay(props: Props) {
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const party = partyResult;

  return (
    <ul className="h-10 border list-none">
      {Object.entries(party.actionEntities).map(([actionEntityId, actionEntity]) => (
        <ul key={actionEntityId}>
          <PersistentActionEntity actionEntity={actionEntity} />
        </ul>
      ))}
    </ul>
  );
}

function PersistentActionEntity({ actionEntity }: { actionEntity: ActionEntity }) {
  const { actionOriginData } = actionEntity.actionEntityProperties;
  if (actionOriginData === undefined) return <div>no persistent entity properties</div>;

  const { actionLevel, stacks } = actionOriginData;

  const { name } = actionEntity.actionEntityProperties;

  return (
    <div>
      <div>{ACTION_ENTITY_STRINGS[name]}</div>
      <div>Level: {actionLevel?.current || 0}</div>
      <div>Stacks: {stacks?.current || 0}</div>
    </div>
  );
}
