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
        if (savedCharacters.length) {
          return (
            <PartyCardListItem>
              <div>
                <div>
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
                <div>
                  <HotkeyButton
                    onClick={() => {
                      if (selectedSavedCharacterId === null) {
                        return;
                      }
                      clientApplication.lobbyClientRef.get().dispatchIntent({
                        type: ClientIntentType.SelectSavedCharacterForProgressGame,
                        data: { entityId: selectedSavedCharacterId },
                      });
                    }}
                  >
                    +
                  </HotkeyButton>
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
    <li className="h-20 p-2 border border-slate-400 mb-2 last:mb-0 flex items-center text-lg">
      {children}
    </li>
  );
});
