import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  AdventuringParty,
  ClientIntentType,
  CombatantId,
  GameMode,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { ReactNode, useState } from "react";
import { CreateCharacterForm } from "./CreateCharacterInPartyForm";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import { IconName, SVG_ICONS } from "@/app/icons";

export const EmptyCharacterSlot = observer(
  ({
    i,
    game,
    party,
    playerOption,
  }: {
    i: number;
    game: SpeedDungeonGame;
    party: AdventuringParty;
    playerOption: undefined | SpeedDungeonPlayer;
  }) => {
    const userIsInThisParty = playerOption && party.playerUsernames.includes(playerOption.username);
    const userIsInAnotherParty = !userIsInThisParty && playerOption && playerOption.partyName;
    const clientApplication = useClientApplication();
    const [selectedSavedCharacterId, setSelectedSavedCharacterId] = useState<CombatantId | null>(
      null
    );
    const [showCreateCharacterForm, setShowCreateCharacterForm] = useState(false);

    if (i !== 0 || userIsInAnotherParty) {
      return (
        <PartyCardListItem>
          <span>Empty slot</span>
        </PartyCardListItem>
      );
    }

    if (userIsInThisParty) {
      if (game.mode === GameMode.Progression) {
        const savedCharacters =
          clientApplication.lobbyContext.savedCharacters.byControlScheme[
            game.characterControlScheme
          ];
        if (showCreateCharacterForm) {
          return <CreateCharacterForm />;
        }
        if (savedCharacters.length) {
          return (
            <PartyCardListItem>
              <div className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 h-10 w-10 border border-slate-400 bg-slate-700">
                <HotkeyButton
                  className="h-full w-full pointer-events-auto"
                  onClick={() => {
                    setShowCreateCharacterForm(!showCreateCharacterForm);
                  }}
                >
                  {SVG_ICONS[IconName.PlusSign](
                    "border border-slate-400 p-2 h-full fill-slate-400"
                  )}
                </HotkeyButton>
              </div>
              <div className="flex h-full ">
                <div className="mr-2">
                  <div className="text-sm">Select saved:</div>
                  <div className="flex">
                    <div className="w-44">
                      <SelectDropdown
                        title={"Select Character"}
                        value={selectedSavedCharacterId}
                        setValue={(id) => setSelectedSavedCharacterId(id)}
                        options={savedCharacters.map((character) => {
                          return {
                            title: character.combatant.getName(),
                            value: character.combatant.getEntityId(),
                          };
                        })}
                        disabled={undefined}
                      />
                    </div>
                    <HotkeyButton
                      className="h-10 border border-l-0 border-slate-400 px-2 text-zinc-300"
                      onClick={() => {
                        if (selectedSavedCharacterId === null) {
                          return;
                        }
                        clientApplication.lobbyClientRef.get().dispatchIntent({
                          type: ClientIntentType.AddSavedCharacterToProgressionGame,
                          data: { entityId: selectedSavedCharacterId },
                        });
                      }}
                    >
                      Assign
                    </HotkeyButton>
                  </div>
                </div>
              </div>
            </PartyCardListItem>
          );
        }
      }
      return <CreateCharacterForm />;
    }

    const { lobbyClientRef } = useClientApplication();

    return (
      <PartyCardListItem>
        <HotkeyButton
          className="h-full w-full"
          onClick={() => {
            lobbyClientRef.get().dispatchIntent({
              type: ClientIntentType.JoinParty,
              data: { partyName: party.name },
            });
          }}
        >
          JOIN PARTY
        </HotkeyButton>
      </PartyCardListItem>
    );
  }
);

const PartyCardListItem = observer(({ children }: { children: ReactNode }) => {
  return (
    <li className="h-20 p-2 border border-slate-400 mb-2 last:mb-0 flex items-center text-lg relative">
      {children}
    </li>
  );
});
