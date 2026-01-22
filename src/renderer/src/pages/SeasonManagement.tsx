import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSeasons } from "@/hooks/useSeasons";

export function SeasonManagement() {
  const {
    seasons,
    currentSeasonId,
    loading,
    error,
    refetch,
    createSeason,
    setCurrentSeason,
    deleteSeason,
  } = useSeasons();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) {
      setSaveError("Please enter a season name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await createSeason(newSeasonName, "", "");
      setSaveSuccess(true);
      setShowAddForm(false);
      setNewSeasonName("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create season");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetCurrentSeason = async (seasonId: number) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await setCurrentSeason(seasonId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to set current season");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSeason = async (seasonId: number, seasonName: string) => {
    if (!confirm(`Are you sure you want to delete season "${seasonName}"?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteSeason(seasonId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete season");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Season Management</h2>
          <p className="text-muted-foreground">
            Manage seasons
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading seasons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Season Management</h2>
          <p className="text-muted-foreground">
            Manage seasons
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                Error loading seasons: {error.message}
              </p>
              <Button onClick={refetch} size="sm" variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Season Management</h2>
          <p className="text-muted-foreground">
            {seasons.length} season{seasons.length !== 1 ? "s" : ""} found
            {currentSeasonId && (
              <span className="ml-2">
                • Current: <span className="font-medium text-foreground">
                  {seasons.find(s => s.id === currentSeasonId)?.name || `ID ${currentSeasonId}`}
                </span>
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Season"}
        </Button>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">Operation successful!</p>
        </div>
      )}

      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {currentSeasonId ? (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Current Season:</span>{" "}
            {seasons.find(s => s.id === currentSeasonId)?.name || `Season ID ${currentSeasonId}`}
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-900">
            <span className="font-semibold">No current season set.</span> Select a season below to set as current.
          </p>
        </div>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Season</CardTitle>
            <CardDescription>Create a new season</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="seasonName" className="text-sm font-medium">
                Season Name
              </label>
              <input
                id="seasonName"
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., 2024/25"
              />
            </div>
            <Button onClick={handleCreateSeason} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Season"}
            </Button>
          </CardContent>
        </Card>
      )}

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No seasons found</p>
            <Button onClick={() => setShowAddForm(true)}>Create Your First Season</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Card
              key={season.id}
              className={`hover:shadow-lg transition-shadow ${
                season.id === currentSeasonId ? "border-2 border-primary" : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{season.name}</span>
                  {season.id === currentSeasonId && (
                    <span className="text-xs font-normal bg-primary text-primary-foreground px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Season ID: {season.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {season.id !== currentSeasonId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSetCurrentSeason(season.id)}
                      disabled={isSaving}
                      title="Note: Set current season functionality has a known issue in the CLI"
                    >
                      Set as Current
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDeleteSeason(season.id, season.name)}
                    disabled={isSaving}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
