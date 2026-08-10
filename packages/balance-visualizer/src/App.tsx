import { UiProvider } from "@speed-dungeon/ui/ui-context";
import Divider from "@speed-dungeon/ui/atoms/Divider";
import { AccuracyAvailabilityPanel } from "./components/AccuracyAvailabilityPanel";
import { AvailableDamagePanel } from "./components/AvailableDamagePanel";
import { ZIndexLayers } from "./z-index-layers";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

export function App() {
  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-recessed text-theme-emphasis p-8">
        <h1 className="text-2xl mb-2">Speed Dungeon Balance</h1>
        <Divider extraStyles="mb-6" />
        <AccuracyAvailabilityPanel />
        <Divider extraStyles="my-10" />
        <AvailableDamagePanel />
      </main>
    </UiProvider>
  );
}
