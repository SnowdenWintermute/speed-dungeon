import {
  FloatingMessageElementType,
  FloatingMessageIconType,
} from "@/stores/game-store/floating-messages";
import React from "react";
import FloatingMessageText from "./FloatingMessageText";
import { useGameStore } from "@/stores/game-store";
import {
  PhysicalDamageType,
  formatMagicalElement,
  formatPhysicalDamageType,
} from "@speed-dungeon/common";
import PiercingIcon from "../../../../../public/img/hp-change-source-icons/piercing.svg";
import SlashingIcon from "../../../../../public/img/hp-change-source-icons/slashing.svg";

export default function CombatantFloatingMessagesDisplay({ entityId }: { entityId: string }) {
  const floatingMessages =
    useGameStore().babylonControlledCombatantDOMData[entityId]?.floatingMessages;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center text-center w-[200px]">
      {floatingMessages?.map((message) => {
        return (
          <div
            className="text-2xl relative flex"
            style={{
              animation: "float-up-and-fade-out", // defined in css file same directory
              animationDuration: `${message.displayTime + 50}ms`,
              animationTimingFunction: "linear",
              animationIterationCount: 1,
            }}
            key={message.id}
          >
            {message.elements.map((element, i) => {
              switch (element.type) {
                case FloatingMessageElementType.Text:
                  return (
                    <FloatingMessageText
                      key={i}
                      classNames={element.classNames + " mr-1 last:mr-0"}
                      text={element.text}
                    />
                  );
                case FloatingMessageElementType.Image:
                  return (
                    <FloatingMessageText
                      key={i}
                      classNames={element.classNames + " mr-1 last:mr-0"}
                      text={`${
                        element.iconData.type === FloatingMessageIconType.PhysicalDamage
                          ? formatPhysicalDamageType(element.iconData.damageType)
                          : formatMagicalElement(element.iconData.element)
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

function getPhysicalDamageTypeIcon(damageType: PhysicalDamageType) {
  switch (damageType) {
    case PhysicalDamageType.Blunt:
      return "Blunt";
    case PhysicalDamageType.Slashing:
      return <SlashingIcon className="h-10 w-10" />;
    case PhysicalDamageType.Piercing:
      return <PiercingIcon className="h-10 w-10" />;
  }
}
