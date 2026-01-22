import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModels } from "@/hooks/useModels";
import { useTouchline } from "@/hooks/useTouchline";
import type { Sponsor } from "@/lib/touchline/types";

export function ModelManagement() {
  const {
    models,
    loading,
    error,
    refetch,
    createModel,
    deleteModel,
  } = useModels();
  const { isReady } = useTouchline();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [selectedModelFile, setSelectedModelFile] = useState<string | null>(null);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<number[]>([]);
  const [availableSponsors, setAvailableSponsors] = useState<Sponsor[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectModelFile = async () => {
    try {
      const filePaths = await window.api.files.selectFiles({
        multiple: false,
        filters: [{ name: 'Model Files', extensions: ['pt', 'pth', 'onnx', 'pb'] }]
      });

      if (filePaths && filePaths.length > 0) {
        setSelectedModelFile(filePaths[0]);
      }
    } catch (err) {
      console.error("Failed to select model file:", err);
      setSaveError("Failed to select model file");
    }
  };

  const fetchAvailableSponsors = async () => {
    if (!isReady) return;

    try {
      const result = await window.api.touchline.sendCommand("sponsors.get_all", {});
      if (result.success && result.data) {
        setAvailableSponsors(result.data.sponsors || []);
      }
    } catch (err) {
      console.error("Failed to fetch sponsors:", err);
    }
  };

  const handleToggleSponsor = (sponsorId: number) => {
    setSelectedSponsorIds(prev =>
      prev.includes(sponsorId)
        ? prev.filter(id => id !== sponsorId)
        : [...prev, sponsorId]
    );
  };

  const handleCreateModel = async () => {
    if (!newModelName.trim()) {
      setSaveError("Please enter a model name");
      return;
    }

    if (!selectedModelFile) {
      setSaveError("Please select a model file");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await createModel(newModelName, selectedModelFile, selectedSponsorIds);

      setSaveSuccess(true);
      setShowAddForm(false);
      setNewModelName("");
      setSelectedModelFile(null);
      setSelectedSponsorIds([]);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create model");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (showAddForm) {
      fetchAvailableSponsors();
    }
  }, [showAddForm]);

  const handleDeleteModel = async (modelId: number, modelName: string) => {
    if (!confirm(`Are you sure you want to delete model "${modelName}"?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteModel(modelId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete model");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Model Management</h2>
          <p className="text-muted-foreground">
            Manage your detection models
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Model Management</h2>
          <p className="text-muted-foreground">
            Manage your detection models
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                Error loading models: {error.message}
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
          <h2 className="text-3xl font-bold tracking-tight">Model Management</h2>
          <p className="text-muted-foreground">
            {models.length} model{models.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Model"}
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

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Model</CardTitle>
            <CardDescription>Register a new detection model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="modelName" className="text-sm font-medium">
                Model Name
              </label>
              <input
                id="modelName"
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., YOLOv11 Team Sponsors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model File</label>
              <div className="space-y-2">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <div className="space-y-2">
                    <div className="text-4xl">🤖</div>
                    <p className="text-sm font-medium">Select model file</p>
                    <Button type="button" variant="outline" onClick={handleSelectModelFile}>
                      Browse Files
                    </Button>
                  </div>
                </div>
                {selectedModelFile && (
                  <div className="bg-muted rounded px-3 py-2">
                    <p className="text-sm truncate">{selectedModelFile.split(/[\\/]/).pop()}</p>
                    <p className="text-xs text-muted-foreground">{selectedModelFile}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Associated Sponsors (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Select which sponsors this model can detect
              </p>
              {availableSponsors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No sponsors available. Add sponsors first to associate them with this model.
                </p>
              ) : (
                <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {availableSponsors.map((sponsor) => (
                      <label
                        key={sponsor.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSponsorIds.includes(sponsor.id)}
                          onChange={() => handleToggleSponsor(sponsor.id)}
                          className="w-4 h-4 rounded border-input"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{sponsor.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {sponsor.id}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {selectedSponsorIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedSponsorIds.length} sponsor{selectedSponsorIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <Button onClick={handleCreateModel} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Model"}
            </Button>
          </CardContent>
        </Card>
      )}

      {models.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No models found</p>
            <Button onClick={() => setShowAddForm(true)}>Create Your First Model</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{model.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    #{model.id}
                  </span>
                </CardTitle>
                <CardDescription>
                  {model.path?.split(/[\\/]/).pop() || "No path"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Path:</span>{" "}
                      <span className="font-medium text-xs break-all">{model.path}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Created:</span>{" "}
                      <span className="font-medium">
                        {new Date(model.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteModel(model.id, model.name)}
                      disabled={isSaving}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
