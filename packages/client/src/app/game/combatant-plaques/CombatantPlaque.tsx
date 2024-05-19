import { useGameStore } from '@/stores/game-store'
import { useLobbyStore } from '@/stores/lobby-store';
import getCurrentBattleOption from '@/utils/getCurrentBattleOption';
import getGameAndParty from '@/utils/getGameAndParty';
import { BUTTON_HEIGHT_SMALL } from '@speed-dungeon/common/src/app_consts'
import React, { useRef, useState }  from 'react'

interface Props {
    entityId: string,
    showExperience: boolean
  }

export default function CombatantPlaque({entityId, showExperience}: Props) {
  const   gameOption = useGameStore().game;
  const usernameOption = useLobbyStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (typeof result === "string") return <div>{result}</div>;
  const [game, party] = result;
const battleOption = getCurrentBattleOption(game, party.name);

const combatantPlaqueRef = useRef<HTMLDivElement>(null);
const [ portraitHeight, setPortraitHeight ] =useState(0);

const targetedBy = combatantTargetedBy(game,combatantId )

const targetingIndicators = targetedBy.length ? 
            <div className="absolute top-[-1.5rem] left-1/2 -translate-x-1/2 z-20 flex" >
                {targeted_by.iter().map(|combatant_id_and_with_what| html!(
                    <TargetingIndicator
                    combat_action={combatant_id_and_with_what.1.clone()}
                    />
                )).collect::<Html>()}
            </div>

: <></>;


  return (
    <div>
        <div className={(`w-96 h-fit border bg-slate-700 pointer-events-auto flex p-2.5 relative box-border ${focused_class} `)}
            ref={combatantPlaqueRef}
            >
            {targeting_indicators}
            {
            // <DetailedCombatantInfoCard
            // combatant_id={combatant_id}
            // combatant_plaque_ref={combatant_plaque_ref.clone()}
            // info_button_is_hovered={info_button_is_hovered.clone()}
            // />
            }
            <div className="h-full aspect-square mr-2 border border-slate-400 bg-slate-600 rounded-full relative"
                 style={{ height: `${portraitHeight}px;`  }}
            >
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm flex items-center justify-center">
                    {combatant_properties.level}
                </div>
            </div>
            <div className="flex-grow"
            ref={name_and_bars_ref}
            >
                <div className="mb-1.5 flex justify-between text-lg">
                    <span>
                        {entity_properties.name.clone()}
                        {unspent_attributes_button}
                    </span>
                    <span>
                    {
                      // <CombatantInfoButton combatant_id={combatant_id} info_button_is_hovered={info_button_is_hovered.clone()} />
                    }
                    </span>
                </div>
                <div className="h-5 mb-1">
                    {hp_bar}
                </div>
                <div className="h-5">
                    {mp_bar}
                </div>
                if props.show_experience {
                    <div className="h-5 mt-1 flex text-sm">
                    {
                      // <FocusCharacterButton id={props.combatant_id} />
                      // {experience_bar}
                    }
                    </div>
                }
            </div>
        </div>
        <div
            className="pt-2"
            style={{ height: `${BUTTON_HEIGHT_SMALL}rem`  }}>
            {is_active_combatant_icon}
        </div>
    </div>
  )
}

