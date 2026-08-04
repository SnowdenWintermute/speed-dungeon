// @refresh reset
"use client";
import GlobalKeyboardEventManager from "./GlobalKeyboardEventManager";
import { SkyColorProvider } from "./SkyColorProvider";
import { observer } from "mobx-react-lite";
import { SceneManager } from "./game-world-view-canvas/SceneManager";
import { MainAppWindow } from "./MainAppWindow";

export default observer(() => {
  return (
    <>
      <GlobalKeyboardEventManager />
      <SceneManager />
      <SkyColorProvider>
        <MainAppWindow />
      </SkyColorProvider>
    </>
  );
});
