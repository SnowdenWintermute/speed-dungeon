import ButtonBasic from '@/app/components/atoms/ButtonBasic'
import { CombatantDetails } from '@speed-dungeon/common'
import React from 'react'

interface Props {
    combatantDetails: CombatantDetails
  }

export default function CombatantDetailsDisplay({combatantDetails}: Props) {
  return (
            <div className="flex justify-between ">
                <CharacterAttributes
                    combatant_properties={combatant_properties.clone()}
                    entity_properties={entity_properties.clone()}
                />
                <div className="h-full pl-4 w-1/2" >
                    <div className="w-full flex justify-end" >
                        <ButtonBasic onClick={close_display} >{"Close"}</ButtonBasic>
                    </div>
                    <div className="flex justify-between" >
                        <span>
                            {"Traits "}
                        </span>
                        <span>
                            {" "}
                        </span>
                    </div>
                    <Divider  />
                    <ul>
                        {combatant_properties.traits.iter().map(|item| html!(
                            <li>
                                <span className="inline-block h-6 w-6">
                                    <HoverableTooltipWrapper tooltip_text={AttrValue::from(item.get_description().to_string())} >
                                        <span className="cursor-help h-full w-full inline-block">
                                            {"ⓘ "}
                                        </span>
                                    </HoverableTooltipWrapper>
                                </span>
                                {format!("{}", item)}
                            </li>
                        )).collect::<Vec<Html>>()}
                    </ul>
                </div>
            </div>

  )
}

