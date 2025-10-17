import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  ClientToServerEvent,
  Combatant,
} from "@speed-dungeon/common";
import XShape from "../../../../../public/img/basic-shapes/x-shape.svg";
import { getCombatantClassIcon } from "@/utils/get-combatant-class-icon";
import { observer } from "mobx-react-lite";

export const CharacterCard = observer(
  ({ character, username }: { character: Combatant; username: string }) => {
    const { combatantClass } = character.combatantProperties;

    const { controllerName } = character.combatantProperties.controlledBy;

    function deleteCharacter() {
      websocketConnection.emit(ClientToServerEvent.DeleteCharacter, character.entityProperties.id);
    }

    const icon = getCombatantClassIcon(combatantClass, "fill-slate-400", "stroke-slate-400");

    return (
      <li className="h-20 mb-2 last:mb-0 flex ">
        <div className="h-20 min-w-20 p-2 mr-4 flex justify-center items-center">{icon}</div>
        <div className="flex justify-between w-full max-w-full overflow-hidden">
          <div className="overflow-hidden w-1/2">
            <h5 className="text-lg whitespace-nowrap text-ellipsis overflow-hidden">
              {character.entityProperties.name}
            </h5>
            <p className="text-slate-400">{COMBATANT_CLASS_NAME_STRINGS[combatantClass]}</p>
          </div>

          <div className="flex flex-grow w-1/2 justify-end">
            {controllerName !== username ? (
              <h5 className="text-lg text-slate-400 text-right w-full whitespace-nowrap">
                {controllerName}
              </h5>
            ) : (
              <HotkeyButton
                className="border border-slate-400 p-1 h-10 w-10"
                onClick={deleteCharacter}
              >
                <XShape className="h-full w-full fill-slate-400" />
              </HotkeyButton>
            )}
          </div>
        </div>
      </li>
    );
  }
);
