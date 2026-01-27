import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTeams } from "@/hooks/useTeams";

export function Teams() {
  const navigate = useNavigate();
  const { teams, loading, error } = useTeams();

  return (

    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Touchline Analytics</h2>
        <p className="text-muted-foreground">
          View all teams in your club
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Loading teams...</p>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No teams found</p>
            <p className="text-sm text-muted-foreground">
              Create teams from the Settings page
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{team.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="w-full"
                >
                  View Data
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
