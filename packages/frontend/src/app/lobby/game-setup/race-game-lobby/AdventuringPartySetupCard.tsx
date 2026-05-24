import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ClientIntentType, SpeedDungeonGame } from "@speed-dungeon/common";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import {
  AdventuringParty,
  BASE_SCREEN_SIZE,
  GOLDEN_RATIO,
  MAX_PARTY_SIZE,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { CharacterCard } from "./CharacterCard";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { EmptyCharacterSlot } from "./EmptyCharacterSlotInParty";

export const PartySetupCard = observer(
  ({
    game,
    party,
    playerOption,
  }: {
    game: SpeedDungeonGame;
    party: AdventuringParty;
    playerOption: undefined | SpeedDungeonPlayer;
  }) => {
    const menuWidth = Math.floor(BASE_SCREEN_SIZE * Math.pow(GOLDEN_RATIO, 3));
    const characters = party.combatantManager.getPartyMemberCharacters();
    const characterCount = characters.length;

    const { session, lobbyClientRef } = useClientApplication();

    const username = session.requireUsername();
    const userIsInThisParty = party.playerUsernames.includes(username);

    function leaveParty() {
      lobbyClientRef.get().dispatchIntent({
        type: ClientIntentType.LeaveParty,
        data: undefined,
      });
    }

    const characterCards = characters.map((character) => {
      return (
        <CharacterCard character={character} username={username} key={character.getEntityId()} />
      );
    });

    return (
      <section className="flex mb-4">
        <div
          className="border border-slate-400 bg-slate-700 pointer-events-auto mr-2"
          style={{ width: `${menuWidth}px` }}
        >
          <div className="w-full p-2  flex justify-between">
            <h4 className="text-xl w-full flex justify-between">
              <span>
                {party.name}
                {userIsInThisParty && (
                  <HotkeyButton
                    className="border border-slate-400 text-base pl-2 pr-2 ml-2"
                    onClick={leaveParty}
                  >
                    LEAVE PARTY
                  </HotkeyButton>
                )}
              </span>
              <span>
                {characterCount}/{MAX_PARTY_SIZE}
              </span>
            </h4>
          </div>
          <ul className="p-2">
            {characterCards}
            {new Array(MAX_PARTY_SIZE - characterCount).fill(null).map((item, i) => (
              <EmptyCharacterSlot
                key={i}
                i={i}
                game={game}
                party={party}
                playerOption={playerOption}
              />
            ))}
          </ul>
        </div>
        <ul>
          {party.playerUsernames.map((username) => (
            <HoverableTooltipWrapper
              tooltipText={username}
              extraStyles="mb-2 last:mb-0"
              key={username}
            >
              <li className="pointer-events-auto h-10 w-10 flex items-center justify-center border border-slate-400 rounded-full bg-slate-700 p-2 text-lg">
                {username.charAt(0).toUpperCase()}
              </li>
            </HoverableTooltipWrapper>
          ))}
        </ul>
      </section>
    );
  }
);
