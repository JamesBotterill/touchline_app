import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDetectionSettings } from "@/hooks/useDetectionSettings";

export function DetectionSettings() {
  const {
    settings,
    loading,
    error,
    refetch,
    updateConfidenceThreshold,
    updateIouThreshold,
    updateMinDetectionArea,
    updateMaxDetections,
  } = useDetectionSettings();

  const [confidenceThreshold, setConfidenceThreshold] = useState(0.4);
  const [iouThreshold, setIouThreshold] = useState(0.45);
  const [minDetectionArea, setMinDetectionArea] = useState(100);
  const [maxDetections, setMaxDetections] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when settings are loaded
  useEffect(() => {
    setConfidenceThreshold(settings.confidenceThreshold);
    setIouThreshold(settings.iouThreshold);
    setMinDetectionArea(settings.minDetectionArea);
    setMaxDetections(settings.maxDetections);
  }, [settings]);

  const handleSaveConfidenceThreshold = async () => {
    if (confidenceThreshold < 0 || confidenceThreshold > 1) {
      setSaveError("Confidence threshold must be between 0 and 1");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateConfidenceThreshold(confidenceThreshold);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save confidence threshold");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIouThreshold = async () => {
    if (iouThreshold < 0 || iouThreshold > 1) {
      setSaveError("IoU threshold must be between 0 and 1");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateIouThreshold(iouThreshold);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save IoU threshold");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMinDetectionArea = async () => {
    if (minDetectionArea < 0) {
      setSaveError("Minimum detection area must be positive");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateMinDetectionArea(minDetectionArea);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save minimum detection area");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMaxDetections = async () => {
    if (maxDetections < 1) {
      setSaveError("Maximum detections must be at least 1");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateMaxDetections(maxDetections);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save maximum detections");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Detection Settings</h2>
          <p className="text-muted-foreground">
            Configure detection parameters and thresholds
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Detection Settings</h2>
          <p className="text-muted-foreground">
            Configure detection parameters and thresholds
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                Error loading settings: {error.message}
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Detection Settings</h2>
        <p className="text-muted-foreground">
          Configure detection parameters and thresholds
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confidence Threshold</CardTitle>
            <CardDescription>
              Minimum confidence score for detections (0-1). Default: 0.4
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="confidenceThreshold" className="text-sm font-medium">
                Confidence Threshold
              </label>
              <input
                id="confidenceThreshold"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Current value: {settings.confidenceThreshold}
              </p>
            </div>
            <Button
              onClick={handleSaveConfidenceThreshold}
              disabled={isSaving || confidenceThreshold === settings.confidenceThreshold}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IoU Threshold</CardTitle>
            <CardDescription>
              Intersection over Union threshold for non-maximum suppression (0-1). Default: 0.45
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="iouThreshold" className="text-sm font-medium">
                IoU Threshold
              </label>
              <input
                id="iouThreshold"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={iouThreshold}
                onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Current value: {settings.iouThreshold}
              </p>
            </div>
            <Button
              onClick={handleSaveIouThreshold}
              disabled={isSaving || iouThreshold === settings.iouThreshold}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minimum Detection Area</CardTitle>
            <CardDescription>
              Minimum area in pixels for valid detections. Default: 100
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="minDetectionArea" className="text-sm font-medium">
                Minimum Detection Area (pixels)
              </label>
              <input
                id="minDetectionArea"
                type="number"
                step="1"
                min="0"
                value={minDetectionArea}
                onChange={(e) => setMinDetectionArea(parseInt(e.target.value, 10))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Current value: {settings.minDetectionArea}
              </p>
            </div>
            <Button
              onClick={handleSaveMinDetectionArea}
              disabled={isSaving || minDetectionArea === settings.minDetectionArea}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maximum Detections</CardTitle>
            <CardDescription>
              Maximum number of detections per frame. Default: 50
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="maxDetections" className="text-sm font-medium">
                Maximum Detections
              </label>
              <input
                id="maxDetections"
                type="number"
                step="1"
                min="1"
                value={maxDetections}
                onChange={(e) => setMaxDetections(parseInt(e.target.value, 10))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Current value: {settings.maxDetections}
              </p>
            </div>
            <Button
              onClick={handleSaveMaxDetections}
              disabled={isSaving || maxDetections === settings.maxDetections}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Detection Settings</CardTitle>
          <CardDescription>
            Important information about detection configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            These are the basic detection settings stored in the database. Advanced detection
            parameters (43 total) must be passed with each detection command.
          </p>
          <p className="text-sm text-muted-foreground">
            See the documentation for more information about advanced detection parameters
            including temporal settings, validation settings, and template matching.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
