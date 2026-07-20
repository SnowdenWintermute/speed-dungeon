import { CharacterControlScheme } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import { useClientApplication } from "@/hooks/create-client-application-context";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";

export const ControlSchemeSelector = observer(() => {
  const clientApplication = useClientApplication();
  const { lobbyContext } = clientApplication;

  return (
    <div className="flex flex-col">
      <span className="mr-2 whitespace-nowrap mb-1">
        <HoverableTooltipWrapper
          extraStyles="inline"
          tooltipText="Allow controling single (Freelancers) or multiple (Captains) characters per player"
        >
          ⓘ{" "}
        </HoverableTooltipWrapper>
        Character control scheme
      </span>
      <div className="w-32">
        <SelectDropdown
          title={"Control Scheme"}
          value={lobbyContext.selectedControlScheme}
          setValue={(value) => {
            lobbyContext.selectedControlScheme = value;
            clientApplication.gameWorldView?.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantModels(
              { softCleanup: false }
            );
          }}
          options={[
            { title: "Freelancer", value: CharacterControlScheme.Freelancer },
            { title: "Captain", value: CharacterControlScheme.Captain },
          ]}
          disabled={undefined}
        />
      </div>
    </div>
  );
});
