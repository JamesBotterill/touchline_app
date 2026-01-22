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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to Touchline Analytics
        </p>
      </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                {loading ? "Loading teams..." : `${teams.length} team(s) found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">
                    Error loading teams: {error.message}
                  </p>
                  <Button onClick={refetch} size="sm" variant="outline">
                    Retry
                  </Button>
                </div>
              ) : loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : teams.length > 0 ? (
                <div className="space-y-2">
                  {teams.slice(0, 3).map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <span className="text-sm font-medium">{team.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ID: {team.id}
                      </span>
                    </div>
                  ))}
                  {teams.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      + {teams.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No teams found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IPC Communication</CardTitle>
              <CardDescription>
                Test Electron IPC renderer communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={ipcHandle} className="w-full">
                Send IPC Ping
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>
                Overview of your activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Teams</span>
                  <span className="font-medium">{teams.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sponsors</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Detections</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="default">Start Detection</Button>
              <Button variant="secondary">Train Model</Button>
              <Button variant="outline">View Reports</Button>
              <Button variant="ghost">Export Data</Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

export default App;
