import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";
import type { Model } from "@/lib/touchline/types";

export function useModels() {
  const { isReady } = useTouchline();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchModels = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.touchline.sendCommand("models.get_all", {});

      if (result.success && result.data) {
        // Filter out the base model (used only for training)
        const allModels = result.data.models || [];
        const filteredModels = allModels.filter(
          (model: Model) => model.name !== "Base Model"
        );
        setModels(filteredModels);
      } else {
        throw new Error(result.error || "Failed to fetch models");
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createModel = async (name: string, path: string, sponsorIds?: number[]) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("models.create", {
        name,
        model_path: path
      });

      if (result.success && result.data?.model_id) {
        const modelId = result.data.model_id;

        // If sponsor IDs are provided, set them for the model
        if (sponsorIds && sponsorIds.length > 0) {
          const sponsorResult = await window.api.touchline.sendCommand("models.set_sponsors", {
            model_id: modelId,
            sponsor_ids: sponsorIds
          });

          if (!sponsorResult.success) {
            console.error("Failed to set sponsors:", sponsorResult.error);
            throw new Error(`Model created but failed to set sponsors: ${sponsorResult.error}`);
          }
        }

        await fetchModels();
        return modelId;
      } else {
        throw new Error(result.error || "Failed to create model");
      }
    } catch (err) {
      console.error("Failed to create model:", err);
      throw err;
    }
  };

  const deleteModel = async (modelId: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("models.delete", {
        model_id: modelId
      });

      if (result.success) {
        await fetchModels();
        return true;
      } else {
        throw new Error(result.error || "Failed to delete model");
      }
    } catch (err) {
      console.error("Failed to delete model:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (isReady) {
      fetchModels();
    }
  }, [isReady]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
    createModel,
    deleteModel,
  };
}
