import {
  FloatingMessageElementType,
  FloatingMessageIconType,
} from "@/stores/game-store/floating-messages";
import React from "react";
import FloatingMessageText from "./FloatingMessageText";
import { useGameStore } from "@/stores/game-store";
import PiercingIcon from "../../../../../public/img/hp-change-source-icons/piercing.svg";
import SlashingIcon from "../../../../../public/img/hp-change-source-icons/slashing.svg";
import {
  KINETIC_DAMAGE_TYPE_STRINGS,
  KineticDamageType,
  MAGICAL_ELEMENT_STRINGS,
} from "@speed-dungeon/common";

export default function CombatantFloatingMessagesDisplay({ entityId }: { entityId: string }) {
  const floatingMessages =
    useGameStore().babylonControlledCombatantDOMData[entityId]?.floatingMessages;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center text-center w-[300px]">
      {floatingMessages?.map((message) => {
        return (
          <div
            className="text-xl relative flex"
            style={{
              animation: "float-up-and-fade-out", // defined in css file same directory
              animationDuration: `${message.displayTime}ms`,
              animationTimingFunction: "linear",
              animationIterationCount: 1,
              opacity: 0.0,
            }}
            key={message.id}
          >
            {message.elements.map((element, i) => {
              switch (element.type) {
                case FloatingMessageElementType.Text:
                  return (
                    <FloatingMessageText
                      key={i}
                      classNames={element.classNames?.mainText + " mr-1 last:mr-0"}
                      text={element.text}
                    />
                  );
                case FloatingMessageElementType.Image:
                  return (
                    <FloatingMessageText
                      key={i}
                      classNames={element.classNames + " mr-1 last:mr-0"}
                      text={`${
                        element.iconData.type === FloatingMessageIconType.KineticDamage
                          ? KINETIC_DAMAGE_TYPE_STRINGS[element.iconData.damageType]
                          : MAGICAL_ELEMENT_STRINGS[element.iconData.element]
                      }`}
                    />
                  );
              }
            })}
          </div>
        );
      })}
    </div>
  );
}

function getPhysicalDamageTypeIcon(damageType: KineticDamageType) {
  switch (damageType) {
    case KineticDamageType.Blunt:
      return "Blunt";
    case KineticDamageType.Slashing:
      return <SlashingIcon className="h-10 w-10" />;
    case KineticDamageType.Piercing:
      return <PiercingIcon className="h-10 w-10" />;
  }
}
