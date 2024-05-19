import React from "react";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import PartyWipeModal from "./PartyWipeModal";
import TopInfoBar from "./TopInfoBar";

export default function Game() {
  const game = useGameStore().game;
  const username = useLobbyStore().username;
  if (!username)
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        "Client has no username and therefore can't know what party they are in"
      </div>
    );
  if (!game)
    return (
      <div className="w-screen h-screen flex items-center justify-center">"No game found?!"</div>
    );
  const player = game.players[username];
  if (!player) return <div>Client player not found</div>;
  const partyName = player.partyName;
  if (!partyName) return <div>Client player doesn't know what party they are in</div>;
  const party = game.adventuringParties[partyName];
  if (!party) return <div>Client thinks it is in a party that doesn't exist</div>;

  const showCharacterSheet = false;
  const viewingCharacterSheet = false;

  const conditionalStyles = showCharacterSheet ? "items-center justify-end" : "";

  const actionMenuAndCharacterSheetContainerConditionalClasses = viewingCharacterSheet
    ? ""
    : "w-full";

  return (
    <main className="h-screen w-screen flex justify-center relative">
      {
        // <CharacterAutofocusManager />
      }
      <PartyWipeModal />
      <div className="w-full h-full max-h-[calc(0.5625 * 100vw)] text-zinc-300 flex flex-col">
        <TopInfoBar />
        <div className="p-4 flex-grow flex flex-col justify-between">
          {
            // <ReadyUpDisplay />
          }
          <div className="flex justify-end">
            <div className="w-fit">
              {
                // monster_plaques
              }
            </div>
          </div>
          <div className="flex flex-wrap justify-between">
            <div className="h-[14rem] min-w-[23rem] max-w-[26rem] w-full border border-slate-400 bg-slate-700 p-2 pointer-events-auto">
              {
                // <CombatLog />
              }
            </div>
            <div className="flex flex-grow justify-end mt-3.5">
              <div className="w-fit flex items-end">
                {
                  // ally_character_plaques
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        // Action Menu and Inventory/Equipment/Character sheet container
      }
      <div
        className={`absolute z-31 top-1/2 -translate-y-1/2 w-full p-4 text-zinc-300 flex flex-row ${conditionalStyles}`}
      >
        <div
          className={`flex flex-col max-w-full ${actionMenuAndCharacterSheetContainerConditionalClasses} `}
        >
          <div className="flex">
            <div className="flex flex-col flex-grow justify-end max-w-full">
              <div className="flex justify-between overflow-hidden">
                {
                  // !focused_character_is_animating &&
                  //   <ActionMenu />
                }
                {!viewingCharacterSheet && (
                  <div className="flex overflow-hidden">
                    <div className="max-h-[13.375rem] h-fit flex flex-grow justify-end">
                      <div className="mr-2 w-[50rem]">
                        {
                          // <ItemDetailsAndComparison />
                        }
                      </div>
                      {
                        // if !game_state.combatants_animating.len() > 0 && !focused_character_is_animating {
                        // <div className="max-w-[25rem] w-[25rem]" >
                        // <ItemsOnGround max_height={25.0} />
                        // </div>
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
            {
              // !focused_character_is_animating &&
              // <CharacterSheet />
            }
          </div>
          {
            // if !focused_character_is_animating{
            // <ItemDetailsViewer />
          }
        </div>
      </div>
    </main>
  );
}
