import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSponsorshipTypes } from "@/hooks/useSponsorshipTypes";

export function SponsorshipTypes() {
  const {
    sponsorshipTypes,
    loading,
    error,
    createSponsorshipType,
    updateSponsorshipType,
    deleteSponsorshipType,
  } = useSponsorshipTypes();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setSaveError("Please enter a name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await createSponsorshipType(newName, newDescription);
      setSaveSuccess(true);
      setShowAddForm(false);
      setNewName("");
      setNewDescription("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create sponsorship type");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (id: number, name: string, description?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditDescription(description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      setSaveError("Please enter a name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateSponsorshipType(id, editName, editDescription);
      setSaveSuccess(true);
      setEditingId(null);
      setEditName("");
      setEditDescription("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update sponsorship type");
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
      await deleteSponsorshipType(id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete sponsorship type");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sponsorship Types</h2>
        <p className="text-muted-foreground">
          Manage the types of sponsorships available in your system
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
        <h3 className="text-xl font-semibold">All Sponsorship Types</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Sponsorship Type"}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Sponsorship Type</CardTitle>
            <CardDescription>Create a new sponsorship type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newName" className="text-sm font-medium">
                Name
              </label>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Jersey Sponsor, Stadium Naming Rights"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newDescription" className="text-sm font-medium">
                Description (optional)
              </label>
              <textarea
                id="newDescription"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Brief description"
                rows={3}
              />
            </div>

            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Sponsorship Type"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Loading sponsorship types...</p>
          </CardContent>
        </Card>
      ) : sponsorshipTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No sponsorship types found</p>
            <Button onClick={() => setShowAddForm(true)}>Add First Sponsorship Type</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sponsorshipTypes.map((type) => (
            <Card key={type.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{type.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    #{type.id}
                  </span>
                </CardTitle>
                {type.description && (
                  <CardDescription>{type.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {editingId === type.id ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(type.id)}
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(type.id, type.name, type.description)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(type.id, type.name)}
                      disabled={isSaving}
                    >
                      Delete
                    </Button>
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
