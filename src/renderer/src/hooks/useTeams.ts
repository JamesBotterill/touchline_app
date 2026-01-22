import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";
import type { Team } from "@/lib/touchline/types";

export function useTeams() {
  const { isReady } = useTouchline();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.touchline.sendCommand("teams.get_all", {});

      if (result.success && result.data) {
        setTeams(result.data.teams || []);
      } else {
        throw new Error(result.error || "Failed to fetch teams");
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (name: string, clubId?: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("teams.create", {
        name,
        club_id: clubId
      });

      if (result.success) {
        await fetchTeams();
        return true;
      } else {
        throw new Error(result.error || "Failed to create team");
      }
    } catch (err) {
      console.error("Failed to create team:", err);
      throw err;
    }
  };

  const updateTeam = async (teamId: number, name: string, clubId?: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("teams.update", {
        team_id: teamId,
        name,
        club_id: clubId
      });

      if (result.success) {
        await fetchTeams();
        return true;
      } else {
        throw new Error(result.error || "Failed to update team");
      }
    } catch (err) {
      console.error("Failed to update team:", err);
      throw err;
    }
  };

  const deleteTeam = async (teamId: number) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("teams.delete", {
        team_id: teamId
      });

      if (result.success) {
        await fetchTeams();
        return true;
      } else {
        throw new Error(result.error || "Failed to delete team");
      }
    } catch (err) {
      console.error("Failed to delete team:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (isReady) {
      fetchTeams();
    }
  }, [isReady]);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}
