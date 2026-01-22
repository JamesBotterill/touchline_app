import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";
import { useAppStore } from "@/stores/appStore";

export function useClub() {
  const { isReady } = useTouchline();
  const { currentClub, setCurrentClub } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadClub = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch the default club (single club system)
      const result = await window.api.touchline.sendCommand("clubs.get_default", {});

      if (result.success && result.data?.club) {
        setCurrentClub(result.data.club);
      } else {
        throw new Error(result.error || "No default club found");
      }
    } catch (err) {
      console.error("Failed to fetch club:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady && !currentClub) {
      loadClub();
    }
  }, [isReady]);

  return {
    currentClub,
    loading,
    error,
    setCurrentClub,
    refetch: loadClub,
  };
}
