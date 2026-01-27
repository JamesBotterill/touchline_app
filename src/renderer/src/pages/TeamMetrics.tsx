import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTouchline } from "@/hooks/useTouchline";
import type { Team, Season, SponsorMetrics, DetectionRun } from "@/lib/touchline/types";

interface SponsorAssignment {
  id: number;
  sponsor_id: number;
  sponsorship_type_id: number;
  season_id: number;
  sponsor_name?: string;
  sponsorship_type_name?: string;
}

interface PlatformMetrics {
  platform_id: number;
  platform_name: string;
  total_value: number;
  detection_count: number;
  average_value: number;
}

export function TeamMetrics() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isReady } = useTouchline();

  const [team, setTeam] = useState<Team | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [detectionRuns, setDetectionRuns] = useState<DetectionRun[]>([]);
  const [sponsorMetrics, setSponsorMetrics] = useState<SponsorMetrics[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics[]>([]);
  const [sponsorAssignments, setSponsorAssignments] = useState<SponsorAssignment[]>([]);
  const [platforms, setPlatforms] = useState<Map<number, string>>(new Map());
  const [sponsorshipTypes, setSponsorshipTypes] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTeamData = async () => {
    if (!isReady || !teamId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch team details
      const teamResult = await window.api.touchline.sendCommand("teams.get", {
        team_id: parseInt(teamId)
      });

      if (teamResult.success && teamResult.data) {
        setTeam(teamResult.data.team || null);

        // Get sponsor assignments (will enrich with names after sponsorship types are loaded)
        if (teamResult.data.team?.sponsor_assignments) {
          setSponsorAssignments(teamResult.data.team.sponsor_assignments);
        }
      }

      // Fetch all seasons
      const seasonsResult = await window.api.touchline.sendCommand("seasons.get_all", {});
      if (seasonsResult.success && seasonsResult.data) {
        const seasonsList = seasonsResult.data.seasons || [];
        setSeasons(seasonsList);

        // Set current season as default
        const currentSeason = seasonsList.find((s: Season) => s.is_current === 1);
        if (currentSeason) {
          setSelectedSeasonId(currentSeason.id);
        } else if (seasonsList.length > 0) {
          setSelectedSeasonId(seasonsList[0].id);
        }
      }

      // Fetch social media platforms
      const platformsResult = await window.api.touchline.sendCommand("social_media.get_platforms", {});
      if (platformsResult.success && platformsResult.data?.platforms) {
        const platformMap = new Map<number, string>();
        for (const platform of platformsResult.data.platforms) {
          platformMap.set(platform.id, platform.name);
        }
        setPlatforms(platformMap);
      }

      // Fetch sponsorship types
      const typesResult = await window.api.touchline.sendCommand("sponsorship_types.get_all", {});
      if (typesResult.success && typesResult.data?.sponsorship_types) {
        const typesMap = new Map<number, string>();
        for (const type of typesResult.data.sponsorship_types) {
          typesMap.set(type.id, type.name);
        }
        setSponsorshipTypes(typesMap);
      }
    } catch (err) {
      console.error("Failed to fetch team data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate total value for a detection run
  const calculateRunTotalValue = (run: DetectionRun): number => {
    let runMetrics = run.metrics;
    if (typeof runMetrics === 'string') {
      try {
        runMetrics = JSON.parse(runMetrics);
      } catch {
        return 0;
      }
    }

    if (!Array.isArray(runMetrics)) return 0;

    let totalValue = 0;
    for (const metric of runMetrics) {
      if (typeof metric === 'object' && metric) {
        totalValue += parseFloat(metric.total_value || metric.value || 0);
      }
    }

    return totalValue;
  };

  // Client-side calculation functions (matching Flet app approach)
  const calculateSponsorMetrics = (runs: DetectionRun[]): SponsorMetrics[] => {
    const sponsorMap = new Map<string, SponsorMetrics>();

    for (const run of runs) {
      // Parse metrics if they're stored as JSON string
      let runMetrics = run.metrics;
      if (typeof runMetrics === 'string') {
        try {
          runMetrics = JSON.parse(runMetrics);
        } catch {
          continue;
        }
      }

      if (!Array.isArray(runMetrics)) continue;

      for (const metric of runMetrics) {
        if (!metric || typeof metric !== 'object') continue;

        const sponsorName = metric.sponsor_name || metric.sponsor || metric.name || 'Unknown';
        const sponsorId = metric.sponsor_id || 0;

        if (!sponsorMap.has(sponsorName)) {
          sponsorMap.set(sponsorName, {
            sponsor_id: sponsorId,
            sponsor_name: sponsorName,
            total_appearances: 0,
            total_duration: 0,
            avg_quality: 0,
            total_value: 0,
            social_value: 0
          });
        }

        const sponsor = sponsorMap.get(sponsorName)!;

        // Aggregate metrics
        sponsor.total_appearances += parseFloat(metric.appearances || 0);
        sponsor.total_duration += parseFloat(metric.total_seconds || metric.duration || 0);
        sponsor.total_value += parseFloat(metric.total_value || metric.value || 0);
        if (sponsor.social_value !== undefined) {
          sponsor.social_value += parseFloat(metric.social_value || 0);
        }
      }
    }

    // Convert map to array and sort by total value
    return Array.from(sponsorMap.values()).sort((a, b) => b.total_value - a.total_value);
  };

  const calculatePlatformMetrics = (runs: DetectionRun[]): PlatformMetrics[] => {
    const platformMap = new Map<number, PlatformMetrics>();

    for (const run of runs) {
      // Skip runs without social platform data
      if (!run.social_platform_id) continue;

      const platformId = run.social_platform_id;

      if (!platformMap.has(platformId)) {
        platformMap.set(platformId, {
          platform_id: platformId,
          platform_name: platforms.get(platformId) || 'Unknown',
          total_value: 0,
          detection_count: 0,
          average_value: 0
        });
      }

      const platform = platformMap.get(platformId)!;
      platform.detection_count++;

      // Calculate total value from metrics
      let runMetrics = run.metrics;
      if (typeof runMetrics === 'string') {
        try {
          runMetrics = JSON.parse(runMetrics);
        } catch {
          continue;
        }
      }

      if (Array.isArray(runMetrics)) {
        for (const metric of runMetrics) {
          if (typeof metric === 'object') {
            platform.total_value += parseFloat(metric.total_value || metric.value || 0);
          }
        }
      }
    }

    // Calculate average values
    const platformsList = Array.from(platformMap.values());
    for (const platform of platformsList) {
      if (platform.detection_count > 0) {
        platform.average_value = platform.total_value / platform.detection_count;
      }
    }

    return platformsList.sort((a, b) => b.total_value - a.total_value);
  };

  const fetchSeasonData = async () => {
    if (!isReady || !teamId || !selectedSeasonId) return;

    try {
      // Fetch ALL detection runs for the team
      const runsResult = await window.api.touchline.sendCommand("metrics.get_team_runs", {
        team_id: parseInt(teamId),
        limit: 100
      });

      console.log("[TeamMetrics] Detection runs result:", runsResult);

      if (!runsResult.success || !runsResult.data?.detection_runs) {
        setDetectionRuns([]);
        setSponsorMetrics([]);
        setPlatformMetrics([]);
        return;
      }

      // Filter runs by season CLIENT-SIDE (matching Flet app approach)
      const allRuns = runsResult.data.detection_runs;
      const seasonRuns = allRuns.filter((run: DetectionRun) => run.season_id === selectedSeasonId);

      console.log(`[TeamMetrics] Filtered ${allRuns.length} total runs to ${seasonRuns.length} for season ${selectedSeasonId}`);

      // Enrich detection runs with calculated total value
      const enrichedRuns = seasonRuns.map((run: DetectionRun) => ({
        ...run,
        total_value: calculateRunTotalValue(run)
      }));

      // Set detection runs
      setDetectionRuns(enrichedRuns);

      // Calculate metrics CLIENT-SIDE
      const calculatedSponsorMetrics = calculateSponsorMetrics(seasonRuns);
      const calculatedPlatformMetrics = calculatePlatformMetrics(seasonRuns);

      // If no sponsor metrics found, show placeholders for assigned sponsors
      if (calculatedSponsorMetrics.length === 0) {
        const seasonAssignments = sponsorAssignments.filter(
          (sa) => sa.season_id === selectedSeasonId
        );

        const placeholderMetrics: SponsorMetrics[] = seasonAssignments.map((assignment) => ({
          sponsor_id: assignment.sponsor_id,
          sponsor_name: assignment.sponsor_name || `Sponsor #${assignment.sponsor_id}`,
          total_appearances: 0,
          total_duration: 0,
          avg_quality: 0,
          total_value: 0,
          social_value: 0
        }));

        setSponsorMetrics(placeholderMetrics);
      } else {
        setSponsorMetrics(calculatedSponsorMetrics);
      }

      setPlatformMetrics(calculatedPlatformMetrics);
    } catch (err) {
      console.error("Failed to fetch season data:", err);
      setDetectionRuns([]);
      setSponsorMetrics([]);
      setPlatformMetrics([]);
    }
  };

  useEffect(() => {
    if (isReady && teamId) {
      fetchTeamData();
    }
  }, [isReady, teamId]);

  useEffect(() => {
    if (selectedSeasonId && platforms.size > 0) {
      fetchSeasonData();
    }
  }, [selectedSeasonId, sponsorAssignments, platforms]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate("/teams")}>
            ← Back to Teams
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Team Metrics</h2>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading team metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate("/teams")}>
            ← Back to Teams
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Team Metrics</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error?.message || "Team not found"}
            </p>
            <Button onClick={() => navigate("/teams")} className="mt-4">
              Back to Teams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paginatedDetections = detectionRuns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(detectionRuns.length / itemsPerPage);

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => navigate("/teams")}>
          ← Back to Teams
        </Button>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{team.name}</h2>
            <p className="text-muted-foreground">
              View performance metrics and detections
            </p>
          </div>
          <Button onClick={() => navigate(`/teams/${teamId}/new-detection`)}>
            Add Detection
          </Button>
        </div>
      </div>

      {/* Season Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Season Selection</CardTitle>
          <CardDescription>Choose a season to view metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="seasonSelect" className="text-sm font-medium">
              Select Season
            </label>
            <select
              id="seasonSelect"
              value={selectedSeasonId || ""}
              onChange={(e) => setSelectedSeasonId(parseInt(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a season...</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                  {season.is_current === 1 ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedSeasonId && (
        <>
          {/* Detections Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Detections</h3>
            {detectionRuns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-muted-foreground">No detections found for this season</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-center p-3 font-medium">Total Value</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDetections.map((run) => (
                            <tr key={run.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 text-sm">
                                {new Date(run.detection_date || run.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-sm text-center">
                                {run.total_value ? `£${run.total_value.toFixed(2)}` : '-'}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigate(`/teams/${teamId}/detections/${run.id}`)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sponsor Metrics */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sponsor Metrics</h3>
            {sponsorMetrics.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-muted-foreground">No sponsors assigned for this season</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sponsorMetrics.map((metric) => {
                  const assignment = sponsorAssignments.find(
                    (sa) => sa.sponsor_id === metric.sponsor_id && sa.season_id === selectedSeasonId
                  );

                  const sponsorshipTypeName = assignment
                    ? sponsorshipTypes.get(assignment.sponsorship_type_id) || "Unknown Type"
                    : "No Assignment";

                  return (
                    <Card key={metric.sponsor_id}>
                      <CardHeader>
                        <CardTitle className="text-base">{metric.sponsor_name}</CardTitle>
                        <CardDescription>
                          {sponsorshipTypeName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Value:</span>
                            <span className="font-medium">£{metric.total_value.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Detections:</span>
                            <span className="font-medium">{metric.total_appearances}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Social Platform Metrics */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Social Platform Metrics</h3>
            {platformMetrics.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-muted-foreground">No platform metrics available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platformMetrics.map((metric) => (
                  <Card key={metric.platform_id}>
                    <CardHeader>
                      <CardTitle className="text-base">{metric.platform_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Value:</span>
                          <span className="font-medium">£{metric.total_value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Average Value:</span>
                          <span className="font-medium">£{metric.average_value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Detections:</span>
                          <span className="font-medium">{metric.detection_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
