import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";
import type { SponsorshipType } from "@/lib/touchline/types";

export function useSponsorshipTypes() {
  const { isReady } = useTouchline();
  const [sponsorshipTypes, setSponsorshipTypes] = useState<SponsorshipType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSponsorshipTypes = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.touchline.sendCommand("sponsorship_types.get_all", {});

      if (result.success && result.data) {
        setSponsorshipTypes(result.data.sponsorship_types || []);
      } else {
        throw new Error(result.error || "Failed to fetch sponsorship types");
      }
    } catch (err) {
      console.error("Failed to fetch sponsorship types:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createSponsorshipType = async (name: string, description?: string) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("sponsorship_types.create", {
        name,
        description: description || undefined
      });

      if (result.success) {
        await fetchSponsorshipTypes();
        return true;
      } else {
        throw new Error(result.error || "Failed to create sponsorship type");
      }
    } catch (err) {
      console.error("Failed to create sponsorship type:", err);
      throw err;
    }
  };

  const updateSponsorshipType = async (id: number, name: string, description?: string) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("sponsorship_types.update", {
        sponsorship_type_id: id,
        name,
        description: description || undefined
      });

      if (result.success) {
        await fetchSponsorshipTypes();
        return true;
      } else {
        throw new Error(result.error || "Failed to update sponsorship type");
      }
    } catch (err) {
      console.error("Failed to update sponsorship type:", err);
      throw err;
    }
  };

  const deleteSponsorshipType = async (id: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("sponsorship_types.delete", {
        sponsorship_type_id: id
      });

      if (result.success) {
        await fetchSponsorshipTypes();
        return true;
      } else {
        throw new Error(result.error || "Failed to delete sponsorship type");
      }
    } catch (err) {
      console.error("Failed to delete sponsorship type:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (isReady) {
      fetchSponsorshipTypes();
    }
  }, [isReady]);

  return {
    sponsorshipTypes,
    loading,
    error,
    refetch: fetchSponsorshipTypes,
    createSponsorshipType,
    updateSponsorshipType,
    deleteSponsorshipType,
  };
}
