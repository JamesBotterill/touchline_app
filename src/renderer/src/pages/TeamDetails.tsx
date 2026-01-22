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
import type { Team, Sponsor, Model, Season, SponsorshipType } from "@/lib/touchline/types";

interface SponsorAssignment {
  id: number;
  sponsor_id: number;
  sponsorship_type_id: number;
  season_id: number;
  sponsor?: Sponsor;
  sponsorship_type?: SponsorshipType;
  season?: Season;
}

export function TeamDetails() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isReady } = useTouchline();

  const [team, setTeam] = useState<Team | null>(null);
  const [sponsorAssignments, setSponsorAssignments] = useState<SponsorAssignment[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [showAssignSponsor, setShowAssignSponsor] = useState(false);
  const [availableSponsors, setAvailableSponsors] = useState<Sponsor[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<Season[]>([]);
  const [availableSponsorshipTypes, setAvailableSponsorshipTypes] = useState<SponsorshipType[]>([]);
  const [selectedSponsorId, setSelectedSponsorId] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedSponsorshipTypeId, setSelectedSponsorshipTypeId] = useState("");

  const [showAssignModel, setShowAssignModel] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedModelSeasonId, setSelectedModelSeasonId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchTeamDetails = async () => {
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
      }

      // Sponsor assignments are in the team data
      if (teamResult.success && teamResult.data?.team?.sponsor_assignments) {
        setSponsorAssignments(teamResult.data.team.sponsor_assignments || []);
      }

      // Fetch full sponsor details for each assignment
      if (teamResult.data?.team?.sponsor_assignments) {
        const assignments = teamResult.data.team.sponsor_assignments;
        const enrichedAssignments = await Promise.all(
          assignments.map(async (assignment: SponsorAssignment) => {
            const sponsorResult = await window.api.touchline.sendCommand("sponsors.get", {
              sponsor_id: assignment.sponsor_id
            });
            const seasonResult = await window.api.touchline.sendCommand("seasons.get", {
              season_id: assignment.season_id
            });
            const typeResult = await window.api.touchline.sendCommand("sponsorship_types.get", {
              sponsorship_type_id: assignment.sponsorship_type_id
            });

            return {
              ...assignment,
              sponsor: sponsorResult.data?.sponsor,
              season: seasonResult.data?.season,
              sponsorship_type: typeResult.data?.sponsorship_type
            };
          })
        );
        setSponsorAssignments(enrichedAssignments);
      }

      // Fetch team models
      const modelsResult = await window.api.touchline.sendCommand("teams.get_models", {
        team_id: parseInt(teamId)
      });

      if (modelsResult.success && modelsResult.data) {
        setModels(modelsResult.data.models || []);
      }
    } catch (err) {
      console.error("Failed to fetch team details:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSponsors = async () => {
    try {
      const [sponsorsResult, seasonsResult, typesResult] = await Promise.all([
        window.api.touchline.sendCommand("sponsors.get_all", {}),
        window.api.touchline.sendCommand("seasons.get_all", {}),
        window.api.touchline.sendCommand("sponsorship_types.get_all", {})
      ]);

      if (sponsorsResult.success && sponsorsResult.data) {
        setAvailableSponsors(sponsorsResult.data.sponsors || []);
      }
      if (seasonsResult.success && seasonsResult.data) {
        setAvailableSeasons(seasonsResult.data.seasons || []);
      }
      if (typesResult.success && typesResult.data) {
        setAvailableSponsorshipTypes(typesResult.data.sponsorship_types || []);
      }
    } catch (err) {
      console.error("Failed to fetch available sponsors:", err);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const [modelsResult, seasonsResult] = await Promise.all([
        window.api.touchline.sendCommand("models.get_all", {}),
        window.api.touchline.sendCommand("seasons.get_all", {})
      ]);

      if (modelsResult.success && modelsResult.data) {
        setAvailableModels(modelsResult.data.models || []);
      }
      if (seasonsResult.success && seasonsResult.data) {
        setAvailableSeasons(seasonsResult.data.seasons || []);
      }
    } catch (err) {
      console.error("Failed to fetch available models:", err);
    }
  };

  const handleAssignSponsor = async () => {
    if (!selectedSponsorId || !selectedSeasonId || !selectedSponsorshipTypeId || !teamId) {
      setSaveError("Please select a sponsor, season, and sponsorship type");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("teams.assign_sponsor", {
        team_id: parseInt(teamId),
        sponsor_id: parseInt(selectedSponsorId),
        season_id: parseInt(selectedSeasonId),
        sponsorship_type_id: parseInt(selectedSponsorshipTypeId)
      });

      if (result.success) {
        setSaveSuccess(true);
        setShowAssignSponsor(false);
        setSelectedSponsorId("");
        setSelectedSeasonId("");
        setSelectedSponsorshipTypeId("");
        await fetchTeamDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to assign sponsor");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to assign sponsor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSponsor = async (assignmentId: number, sponsorName: string) => {
    if (!confirm(`Are you sure you want to remove "${sponsorName}" from this team?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("teams.remove_sponsor", {
        assignment_id: assignmentId
      });

      if (result.success) {
        setSaveSuccess(true);
        await fetchTeamDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to remove sponsor");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to remove sponsor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignModel = async () => {
    if (!selectedModelId || !teamId) {
      setSaveError("Please select a model");
      return;
    }

    if (!selectedModelSeasonId) {
      setSaveError("Please select a season");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("teams.assign_model", {
        team_id: parseInt(teamId),
        model_id: parseInt(selectedModelId),
        season_id: parseInt(selectedModelSeasonId)
      });

      if (result.success) {
        setSaveSuccess(true);
        setShowAssignModel(false);
        setSelectedModelId("");
        setSelectedModelSeasonId("");
        await fetchTeamDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to assign model");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to assign model");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveModel = async (modelId: number, modelName: string, seasonId: number) => {
    if (!confirm(`Are you sure you want to remove model "${modelName}" from this team?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("teams.remove_model", {
        team_id: parseInt(teamId!),
        model_id: modelId,
        season_id: seasonId
      });

      if (result.success) {
        setSaveSuccess(true);
        await fetchTeamDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to remove model");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to remove model");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isReady && teamId) {
      fetchTeamDetails();
    }
  }, [isReady, teamId]);

  useEffect(() => {
    if (showAssignSponsor) {
      fetchAvailableSponsors();
    }
  }, [showAssignSponsor]);

  useEffect(() => {
    if (showAssignModel) {
      fetchAvailableModels();
    }
  }, [showAssignModel]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate("/teams")}>
            ← Back to Teams
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Team Details</h2>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading team details...</p>
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
          <h2 className="text-3xl font-bold tracking-tight mt-4">Team Details</h2>
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

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => navigate("/teams")}>
          ← Back to Teams
        </Button>
        <h2 className="text-3xl font-bold tracking-tight mt-4">{team.name}</h2>
        <p className="text-muted-foreground">
          Manage team sponsors and models
        </p>
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

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Team ID:</span>{" "}
              <span className="font-medium">#{team.id}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Club ID:</span>{" "}
              <span className="font-medium">{team.club_id}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sponsors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Sponsors</h3>
          <Button onClick={() => setShowAssignSponsor(!showAssignSponsor)}>
            {showAssignSponsor ? "Cancel" : "Assign Sponsor"}
          </Button>
        </div>

        {showAssignSponsor && (
          <Card>
            <CardHeader>
              <CardTitle>Assign Sponsor</CardTitle>
              <CardDescription>Assign a sponsor to this team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sponsorSelect" className="text-sm font-medium">
                  Select Sponsor
                </label>
                <select
                  id="sponsorSelect"
                  value={selectedSponsorId}
                  onChange={(e) => setSelectedSponsorId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a sponsor...</option>
                  {availableSponsors.map((sponsor) => (
                    <option key={sponsor.id} value={sponsor.id}>
                      {sponsor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="seasonSelect" className="text-sm font-medium">
                  Select Season
                </label>
                <select
                  id="seasonSelect"
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a season...</option>
                  {availableSeasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="typeSelect" className="text-sm font-medium">
                  Select Sponsorship Type
                </label>
                <select
                  id="typeSelect"
                  value={selectedSponsorshipTypeId}
                  onChange={(e) => setSelectedSponsorshipTypeId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a type...</option>
                  {availableSponsorshipTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={handleAssignSponsor} disabled={isSaving}>
                {isSaving ? "Assigning..." : "Assign Sponsor"}
              </Button>
            </CardContent>
          </Card>
        )}

        {sponsorAssignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-muted-foreground mb-4">No sponsors assigned</p>
              <Button onClick={() => setShowAssignSponsor(true)}>Assign First Sponsor</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sponsorAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{assignment.sponsor?.name || `Sponsor #${assignment.sponsor_id}`}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      #{assignment.sponsor_id}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {assignment.sponsorship_type?.name || `Type #${assignment.sponsorship_type_id}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-3">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Season:</span>{" "}
                      <span className="font-medium">{assignment.season?.name || `#${assignment.season_id}`}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveSponsor(assignment.id, assignment.sponsor?.name || "sponsor")}
                    disabled={isSaving}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Models Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Models</h3>
          <Button onClick={() => setShowAssignModel(!showAssignModel)}>
            {showAssignModel ? "Cancel" : "Assign Model"}
          </Button>
        </div>

        {showAssignModel && (
          <Card>
            <CardHeader>
              <CardTitle>Assign Model</CardTitle>
              <CardDescription>Assign a detection model to this team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="modelSelect" className="text-sm font-medium">
                  Select Model
                </label>
                <select
                  id="modelSelect"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a model...</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="modelSeasonSelect" className="text-sm font-medium">
                  Select Season
                </label>
                <select
                  id="modelSeasonSelect"
                  value={selectedModelSeasonId}
                  onChange={(e) => setSelectedModelSeasonId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a season...</option>
                  {availableSeasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={handleAssignModel} disabled={isSaving}>
                {isSaving ? "Assigning..." : "Assign Model"}
              </Button>
            </CardContent>
          </Card>
        )}

        {models.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-muted-foreground mb-4">No models assigned</p>
              <Button onClick={() => setShowAssignModel(true)}>Assign First Model</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{model.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      #{model.id}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-3">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Path:</span>{" "}
                      <span className="font-medium text-xs break-all">{model.path}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Season:</span>{" "}
                      <span className="font-medium">{model.season_name || `#${model.season_id}`}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Created:</span>{" "}
                      <span className="font-medium text-xs">
                        {new Date(model.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveModel(model.id, model.name, model.season_id)}
                    disabled={isSaving}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
