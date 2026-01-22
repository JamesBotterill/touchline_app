import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";
import type { Sponsor } from "@/lib/touchline/types";

export function useSponsors() {
  const { isReady } = useTouchline();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSponsors = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.touchline.sendCommand("sponsors.get_standalone", {});

      if (result.success && result.data) {
        setSponsors(result.data.sponsors || []);
      } else {
        throw new Error(result.error || "Failed to fetch sponsors");
      }
    } catch (err) {
      console.error("Failed to fetch sponsors:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createSponsor = async (
    name: string,
    logoPaths: string[],
    baseValue: number = 0,
    audienceMatch: number = 0,
    brandPower: number = 0
  ) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      // Create sponsor first
      const result = await window.api.touchline.sendCommand("sponsors.create", {
        name,
        base_value: baseValue,
        audience_match: audienceMatch,
        brand_power: brandPower
      });

      if (result.success && result.data?.sponsor_id) {
        const sponsorId = result.data.sponsor_id;

        // If there are logos, set them
        if (logoPaths.length > 0) {
          await window.api.touchline.sendCommand("sponsors.set_logos", {
            sponsor_id: sponsorId,
            logo_paths: logoPaths
          });
        }

        await fetchSponsors();
        return sponsorId;
      } else {
        throw new Error(result.error || "Failed to create sponsor");
      }
    } catch (err) {
      console.error("Failed to create sponsor:", err);
      throw err;
    }
  };

  const deleteSponsor = async (sponsorId: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("sponsors.delete", {
        sponsor_id: sponsorId
      });

      if (result.success) {
        await fetchSponsors();
        return true;
      } else {
        throw new Error(result.error || "Failed to delete sponsor");
      }
    } catch (err) {
      console.error("Failed to delete sponsor:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (isReady) {
      fetchSponsors();
    }
  }, [isReady]);

  return {
    sponsors,
    loading,
    error,
    refetch: fetchSponsors,
    createSponsor,
    deleteSponsor,
  };
}
