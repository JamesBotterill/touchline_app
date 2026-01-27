import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTeams } from "@/hooks/useTeams";
import { useTouchline } from "@/hooks/useTouchline";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";
import { useClub } from "@/hooks/useClub";

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");
  const { isInitializing, isReady, error: initError } = useTouchline();
  const { teams, loading, error, refetch } = useTeams();
  // Load general settings and club on app init to populate store
  useGeneralSettings();
  useClub();

  // Show loading screen while initializing
  if (isInitializing || !isReady) {
    return (
      <LoadingScreen
        message="Initializing Touchline Analytics..."
        error={initError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Touchline Analytics</h2>
      </div>
    </div>
  );
}

export default App;
