import { useState } from "react";
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
import { useAppStore } from "@/stores/appStore";

export function Teams() {
  const navigate = useNavigate();
  const { currentClub } = useAppStore();
  const { teams, loading, error, refetch, createTeam, updateTeam, deleteTeam } = useTeams();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setSaveError("Please enter a team name");
      return;
    }

    if (!currentClub?.id) {
      setSaveError("No club selected");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await createTeam(newName, currentClub.id);
      setSaveSuccess(true);
      setShowAddForm(false);
      setNewName("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      setSaveError("Please enter a team name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateTeam(id, editName);
      setSaveSuccess(true);
      setEditingId(null);
      setEditName("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteTeam(id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete team");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        <p className="text-muted-foreground">
          Manage your teams
        </p>
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

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error: {error.message}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">All Teams</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Team"}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team</CardTitle>
            <CardDescription>Create a new team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newName" className="text-sm font-medium">
                Team Name
              </label>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., First Team, Academy"
              />
            </div>

            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Team"}
            </Button>
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
            <Button onClick={() => setShowAddForm(true)}>Create Your First Team</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{team.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    #{team.id}
                  </span>
                </CardTitle>
                <CardDescription>
                  Club ID: {team.club_id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingId === team.id ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Team Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(team.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(team.id, team.name)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(team.id, team.name)}
                        disabled={isSaving}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
