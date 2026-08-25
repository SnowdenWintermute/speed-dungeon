import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { ZIndexLayers } from "./z-index-layers";
import { AttackDamagePanel } from "./components/AttackDamagePanel";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

export function App() {
  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-recessed text-theme-emphasis p-8">
        <h1 className="text-2xl mb-4">Speed Dungeon Balance</h1>
        <AttackDamagePanel />
      </main>
    </UiProvider>
  );
}
