// @refresh reset
"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ClientToServerEvent, GameListEntry } from "@speed-dungeon/common";
import ButtonBasic from "../../components/atoms/ButtonBasic";
import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";
import Divider from "@/app/components/atoms/Divider";
import { useLobbyStore } from "@/stores/lobby-store";
import useElementIsOverflowing from "@/hooks/use-element-is-overflowing";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function GamesSection() {
  const [gameName, setGameName] = useState("");
  const [gameListRefreshedAt, setGameListRefreshedAt] = useState("...");
  const gameList = useLobbyStore().gameList;
  const gameListRef = useRef(null);
  const gameListIsOverflowing = useElementIsOverflowing(gameListRef.current);

  useEffect(() => {
    setGameListRefreshedAt(new Date(Date.now()).toLocaleTimeString());
  }, []);

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    websocketConnection.emit(ClientToServerEvent.CreateGame, gameName);
  }

  function refreshGameList() {
    websocketConnection.emit(ClientToServerEvent.RequestsGameList);
    setGameListRefreshedAt(new Date(Date.now()).toLocaleTimeString());
  }

  // const testGames = new Array(40).fill("").map((item) => {
  //   const entry = {
  //     gameName: "some game nameeeeeeeeeeeee",
  //     numberOfUsers: Math.floor(Math.random() * 3),
  //     timeStarted: null,
  //   };

  //   return <GameListItem game={entry} />;
  // });

  return (
    <div
      id="games-section"
      className="w-full h-full flex flex-wrap flex-col-reverse justify-end laptop:flex-row"
      style={{
        padding: `${SPACING_REM_LARGE}rem`,
        // width: `calc(${BASE_SCREEN_SIZE}px * ${Math.pow(GOLDEN_RATIO, 2)})`,
        width: "900px",
        maxWidth: "100%",
      }}
    >
      <div
        id="current-games-container"
        className="pointer-events-auto h-fit w-full laptop:w-6/12 laptop:pr-2"
      >
        <div className="mb-2">Last refreshed at {gameListRefreshedAt}</div>
        <div
          className="text-lg h-10 flex items-center justify-between border border-slate-400 bg-slate-700 mb-2"
          style={{
            paddingLeft: `${SPACING_REM_SMALL}rem`,
          }}
        >
          <div>{gameList.length ? "Current games" : "No current games..."}</div>
          <ButtonBasic extraStyles="border-r-0" onClick={refreshGameList}>
            REFRESH LIST
          </ButtonBasic>
        </div>
        {<Divider />}
        <ul
          className="mb-1 max-h-72 overflow-y-auto"
          ref={gameListRef}
          style={{
            paddingRight: gameListIsOverflowing ? `${SPACING_REM_SMALL}rem` : "",
          }}
        >
          {
            // testGames
          }
          {gameList.map((game) => (
            <GameListItem game={game} key={game.gameName} />
          ))}
        </ul>
      </div>
      <form
        id="create-game-form"
        className="pointer-events-auto h-fit w-full laptop:w-6/12 laptop:pl-2"
        onSubmit={createGame}
      >
        <div className="mb-2">
          Host a multiplayer game{" "}
          <HoverableTooltipWrapper
            extraStyles="inline"
            tooltipText="Host a game where multiple players can control multiple parties of characters and race to the bottom of the dungeon"
          >
            ⓘ{" "}
          </HoverableTooltipWrapper>
        </div>
        <div className="flex flex-1 mb-2">
          <input
            className="bg-slate-700 border border-slate-400 h-10 p-4 min-w-0 flex-1"
            type="text"
            name="game name"
            placeholder="Game name..."
            onChange={(e) => setGameName(e.target.value)}
            value={gameName}
          />
          <ButtonBasic buttonType="submit" extraStyles="border-l-0 bg-slate-700">
            CREATE
          </ButtonBasic>
        </div>
      </form>
    </div>
  );
}

interface GameListItemProps {
  game: GameListEntry;
}

function GameListItem(props: GameListItemProps) {
  function joinGame() {
    websocketConnection.emit(ClientToServerEvent.JoinGame, props.game.gameName);
  }

  return (
    <li className="w-full flex items-center border border-slate-400 mb-2 pointer-events-auto bg-slate-700">
      <div
        className={`flex-1 overflow-hidden whitespace-nowrap overflow-ellipsis`}
        style={{
          paddingLeft: `${SPACING_REM_SMALL}rem`,
        }}
      >
        {props.game.gameName}
      </div>
      <div className="h-10 w-28 flex items-center border-r border-l border-slate-400 pl-4 pr-4">
        <div className="overflow-hidden whitespace-nowrap overflow-ellipsis">
          {props.game.numberOfUsers}
          {" player"}
          {props.game.numberOfUsers > 1 || props.game.numberOfUsers === 0 ? "s" : ""}
        </div>
      </div>
      <ButtonBasic
        onClick={joinGame}
        disabled={typeof props.game.timeStarted === "number"}
        extraStyles="border-0"
      >
        {"Join"}
      </ButtonBasic>
    </li>
  );
}
