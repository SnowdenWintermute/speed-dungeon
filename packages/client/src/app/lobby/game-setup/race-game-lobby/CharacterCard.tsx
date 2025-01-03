import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  ClientToServerEvent,
  Combatant,
  CombatantClass,
  formatCombatantClassName,
} from "@speed-dungeon/common";
import Axe from "../../../../../public/img/combatant-class-icons/axe.svg";
import DualSwords from "../../../../../public/img/combatant-class-icons/dual-swords.svg";
import StaffWithSnowflake from "../../../../../public/img/combatant-class-icons/staff-with-snowflake.svg";
import XShape from "../../../../../public/img/basic-shapes/x-shape.svg";

export default function CharacterCard({
  character,
  username,
}: {
  character: Combatant;
  username: string;
}) {
  const { combatantClass, controllingPlayer } = character.combatantProperties;
  function deleteCharacter() {
    websocketConnection.emit(ClientToServerEvent.DeleteCharacter, character.entityProperties.id);
  }

  let icon;
  switch (combatantClass) {
    case CombatantClass.Warrior:
      icon = <Axe className="h-full w-full fill-slate-400" />;
      break;
    case CombatantClass.Mage:
      icon = <StaffWithSnowflake className="h-full w-full fill-slate-400 stroke-slate-400" />;
      break;
    case CombatantClass.Rogue:
      icon = <DualSwords className="h-full w-full stroke-slate-400 fill-slate-400" />;
  }
  return (
    <li className="h-20 mb-2 last:mb-0 flex ">
      <div className="h-20 min-w-20 p-2 mr-4 flex justify-center items-center">{icon}</div>
      <div className="flex justify-between w-full max-w-full overflow-hidden">
        <div className="overflow-hidden w-1/2">
          <h5 className="text-lg whitespace-nowrap text-ellipsis overflow-hidden">
            {character.entityProperties.name}
          </h5>
          <p className="text-slate-400">{formatCombatantClassName(combatantClass)}</p>
        </div>

        <div className="flex flex-grow w-1/2 justify-end">
          {controllingPlayer !== username ? (
            <h5 className="text-lg text-slate-400 text-right w-full whitespace-nowrap">
              {controllingPlayer}
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
