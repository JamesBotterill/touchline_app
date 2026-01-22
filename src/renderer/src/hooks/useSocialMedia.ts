import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";
import type { SocialMediaPlatform } from "@/lib/touchline/types";

export function useSocialMedia() {
  const { isReady } = useTouchline();
  const [platforms, setPlatforms] = useState<SocialMediaPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlatforms = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.touchline.sendCommand("social_media.get_platforms", {});

      if (result.success && result.data) {
        setPlatforms(result.data.platforms || []);
      } else {
        throw new Error(result.error || "Failed to fetch social media platforms");
      }
    } catch (err) {
      console.error("Failed to fetch social media platforms:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createPlatform = async (name: string, baseReach?: number, engagementRate?: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("social_media.create_platform", {
        name,
        base_reach: baseReach,
        engagement_rate: engagementRate
      });

      if (result.success) {
        await fetchPlatforms();
        return result.data?.platform_id;
      } else {
        throw new Error(result.error || "Failed to create social media platform");
      }
    } catch (err) {
      console.error("Failed to create social media platform:", err);
      throw err;
    }
  };

  const deletePlatform = async (platformId: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("social_media.delete_platform", {
        platform_id: platformId
      });

      if (result.success) {
        await fetchPlatforms();
        return true;
      } else {
        throw new Error(result.error || "Failed to delete social media platform");
      }
    } catch (err) {
      console.error("Failed to delete social media platform:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (isReady) {
      fetchPlatforms();
    }
  }, [isReady]);

  return {
    platforms,
    loading,
    error,
    refetch: fetchPlatforms,
    createPlatform,
    deletePlatform,
  };
}
