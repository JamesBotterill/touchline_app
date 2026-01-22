import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";

interface DetectionSettings {
  confidenceThreshold: number;
  iouThreshold: number;
  minDetectionArea: number;
  maxDetections: number;
}

export function useDetectionSettings() {
  const { isReady } = useTouchline();
  const [settings, setSettings] = useState<DetectionSettings>({
    confidenceThreshold: 0.4,
    iouThreshold: 0.45,
    minDetectionArea: 100,
    maxDetections: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all 4 detection settings
      const [confidenceResult, iouResult, minAreaResult, maxDetectionsResult] =
        await Promise.all([
          window.api.touchline.sendCommand("configs.get", {
            category: "detection",
            key: "confidence_threshold"
          }),
          window.api.touchline.sendCommand("configs.get", {
            category: "detection",
            key: "iou_threshold"
          }),
          window.api.touchline.sendCommand("configs.get", {
            category: "detection",
            key: "min_detection_area"
          }),
          window.api.touchline.sendCommand("configs.get", {
            category: "detection",
            key: "max_detections"
          }),
        ]);

      setSettings({
        confidenceThreshold: parseFloat(confidenceResult.data?.value || "0.4"),
        iouThreshold: parseFloat(iouResult.data?.value || "0.45"),
        minDetectionArea: parseInt(minAreaResult.data?.value || "100", 10),
        maxDetections: parseInt(maxDetectionsResult.data?.value || "50", 10),
      });
    } catch (err) {
      console.error("Failed to fetch detection settings:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string | number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("configs.set", {
        category: "detection",
        key,
        value: value.toString()
      });

      if (result.success) {
        // Refresh settings after update
        await fetchSettings();
        return true;
      } else {
        throw new Error(result.error || `Failed to update ${key}`);
      }
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
      throw err;
    }
  };

  const updateConfidenceThreshold = async (value: number) => {
    return updateSetting("confidence_threshold", value);
  };

  const updateIouThreshold = async (value: number) => {
    return updateSetting("iou_threshold", value);
  };

  const updateMinDetectionArea = async (value: number) => {
    return updateSetting("min_detection_area", value);
  };

  const updateMaxDetections = async (value: number) => {
    return updateSetting("max_detections", value);
  };

  useEffect(() => {
    if (isReady) {
      fetchSettings();
    }
  }, [isReady]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateConfidenceThreshold,
    updateIouThreshold,
    updateMinDetectionArea,
    updateMaxDetections,
  };
}
