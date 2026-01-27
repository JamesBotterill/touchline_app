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
import type { Team, Season, Platform, ContentType, PostType } from "@/lib/touchline/types";

export function NewDetection() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { isReady } = useTouchline();

  const [team, setTeam] = useState<Team | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [postTypes, setPostTypes] = useState<PostType[]>([]);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>("");
  const [selectedPostTypeId, setSelectedPostTypeId] = useState<string>("");

  // Engagement metrics
  const [views, setViews] = useState<string>("");
  const [likes, setLikes] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [shares, setShares] = useState<string>("");
  const [saves, setSaves] = useState<string>("");

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [multiResTTA, setMultiResTTA] = useState<string>("0.8,1.0,1.2");
  const [adaptiveResolution, setAdaptiveResolution] = useState(true);
  const [performanceOptions, setPerformanceOptions] = useState(true);
  const [optimizationCache, setOptimizationCache] = useState(true);
  const [memoryOptimizations, setMemoryOptimizations] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isReady || !teamId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch team
      const teamResult = await window.api.touchline.sendCommand("teams.get", {
        team_id: parseInt(teamId)
      });
      if (teamResult.success && teamResult.data) {
        setTeam(teamResult.data.team || null);
      }

      // Fetch seasons
      const seasonsResult = await window.api.touchline.sendCommand("seasons.get_all", {});
      if (seasonsResult.success && seasonsResult.data) {
        const seasonsList = seasonsResult.data.seasons || [];
        setSeasons(seasonsList);

        // Set current season as default
        const currentSeason = seasonsList.find((s: Season) => s.is_current === 1);
        if (currentSeason) {
          setSelectedSeasonId(currentSeason.id.toString());
        }
      }

      // Fetch platforms
      const platformsResult = await window.api.touchline.sendCommand("social_media.get_platforms", {});
      if (platformsResult.success && platformsResult.data) {
        setPlatforms(platformsResult.data.platforms || []);
      }

      // Fetch post types
      const postTypesResult = await window.api.touchline.sendCommand("post_types.get_all", {});
      if (postTypesResult.success && postTypesResult.data) {
        setPostTypes(postTypesResult.data.post_types || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchContentTypes = async (platformId: number) => {
    try {
      const result = await window.api.touchline.sendCommand("social_media.get_content_types", {
        platform_id: platformId
      });
      if (result.success && result.data) {
        setContentTypes(result.data.content_types || []);
      }
    } catch (err) {
      console.error("Failed to fetch content types:", err);
    }
  };

  useEffect(() => {
    if (isReady && teamId) {
      fetchData();
    }
  }, [isReady, teamId]);

  useEffect(() => {
    if (selectedPlatformId) {
      setSelectedContentTypeId("");
      fetchContentTypes(parseInt(selectedPlatformId));
    } else {
      setContentTypes([]);
      setSelectedContentTypeId("");
    }
  }, [selectedPlatformId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedSeasonId) {
      setSaveError("Please select a season");
      return;
    }
    if (!selectedFile) {
      setSaveError("Please select a file");
      return;
    }
    if (!selectedPlatformId) {
      setSaveError("Please select a platform");
      return;
    }
    if (!selectedContentTypeId) {
      setSaveError("Please select a content type");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Save the file to app data
      const fileBuffer = await selectedFile.arrayBuffer();
      const saveResult = await window.api.files.saveFiles([{
        name: selectedFile.name,
        buffer: fileBuffer
      }]);

      if (!saveResult.success || !saveResult.paths || saveResult.paths.length === 0) {
        throw new Error("Failed to save file");
      }

      const filePath = saveResult.paths[0];

      // 2. Get the team's active model for the selected season
      const modelsResult = await window.api.touchline.sendCommand("teams.get_models", {
        team_id: parseInt(teamId!),
        season_id: parseInt(selectedSeasonId)
      });

      if (!modelsResult.success || !modelsResult.data?.models || modelsResult.data.models.length === 0) {
        throw new Error("No model found for this team and season. Please assign a model first.");
      }

      const model = modelsResult.data.models[0];

      // 3. Get output directory path from main process
      const outputDir = await window.api.touchline.sendCommand("configs.get_output_dir", {});
      if (!outputDir.success || !outputDir.data?.path) {
        throw new Error("Failed to get output directory path");
      }

      // Generate output filename
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const outputPath = `${outputDir.data.path}/${baseName}_detection_${timestamp}.mp4`;

      // 4. Prepare detection options
      const detectionOptions: any = {
        input_path: filePath,
        model_path: model.model_path,
        output_path: outputPath,
        team: team?.name || "",
        content_type: contentTypes.find(ct => ct.id === parseInt(selectedContentTypeId))?.name || "",
        hide_display: true,
        show_metrics: false,
        // Include IDs for database recording
        team_id: parseInt(teamId!),
        model_id: model.id,
        season_id: parseInt(selectedSeasonId),
        social_platform_id: parseInt(selectedPlatformId),
        social_content_type_id: parseInt(selectedContentTypeId),
        post_type_id: selectedPostTypeId ? parseInt(selectedPostTypeId) : null
      };

      // Add social metrics if any are provided
      if (views || likes || comments || shares || saves) {
        detectionOptions.social_metrics_data = {
          views: views ? parseInt(views) : undefined,
          likes: likes ? parseInt(likes) : undefined,
          comments: comments ? parseInt(comments) : undefined,
          shares: shares ? parseInt(shares) : undefined,
          saves: saves ? parseInt(saves) : undefined
        };
      }

      // 5. Start async detection
      const detectionResult = await window.api.touchline.sendCommand("detections.detect_async", detectionOptions);

      if (!detectionResult.success || !detectionResult.data) {
        throw new Error(detectionResult.error || "Failed to start detection");
      }

      const taskId = detectionResult.data.task_id;

      // 6. Navigate to detection results page with task_id
      // Include metadata in the navigation state for display
      navigate(`/teams/${teamId}/detections/${taskId}`, {
        state: {
          teamId: parseInt(teamId!),
          seasonId: parseInt(selectedSeasonId),
          platformId: parseInt(selectedPlatformId),
          contentTypeId: parseInt(selectedContentTypeId),
          postTypeId: selectedPostTypeId ? parseInt(selectedPostTypeId) : null,
          filePath,
          fileName: selectedFile.name,
          engagement: {
            views: views ? parseInt(views) : null,
            likes: likes ? parseInt(likes) : null,
            comments: comments ? parseInt(comments) : null,
            shares: shares ? parseInt(shares) : null,
            saves: saves ? parseInt(saves) : null
          }
        }
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to start detection");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/teams/${teamId}`)}>
            ← Back to Team Metrics
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">New Detection</h2>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/teams/${teamId}`)}>
            ← Back to Team Metrics
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">New Detection</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error?.message || "Team not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => navigate(`/teams/${teamId}`)}>
          ← Back to Team Metrics
        </Button>
        <h2 className="text-3xl font-bold tracking-tight mt-4">New Detection</h2>
        <p className="text-muted-foreground">
          {team.name} - Start a new sponsor detection
        </p>
      </div>

      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {/* Season Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Season</CardTitle>
          <CardDescription>Select the season for this detection</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
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
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>Select a video or image file for detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <input
              type="file"
              accept="video/*,image/*"
              onChange={handleFileChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Media Context */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Context</CardTitle>
          <CardDescription>Provide context about where this content was posted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Platform <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a platform...</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Content Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedContentTypeId}
              onChange={(e) => setSelectedContentTypeId(e.target.value)}
              disabled={!selectedPlatformId}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="">Select a content type...</option>
              {contentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {!selectedPlatformId && (
              <p className="text-xs text-muted-foreground">Select a platform first</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Post Type (Optional)</label>
            <select
              value={selectedPostTypeId}
              onChange={(e) => setSelectedPostTypeId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a post type...</option>
              {postTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>Optional engagement statistics for this post</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Views</label>
              <input
                type="number"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Likes</label>
              <input
                type="number"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <input
                type="number"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Shares</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Saves</label>
              <input
                type="number"
                value={saves}
                onChange={(e) => setSaves(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Advanced Options</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide" : "Show"}
            </Button>
          </CardTitle>
          <CardDescription>
            Enable device-specific optimizations and advanced detection settings
          </CardDescription>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Multi-resolution TTA</label>
              <input
                type="text"
                value={multiResTTA}
                onChange={(e) => setMultiResTTA(e.target.value)}
                placeholder="0.8,1.0,1.2"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated scale values (default: 0.8, 1.0, 1.2)
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={adaptiveResolution}
                  onChange={(e) => setAdaptiveResolution(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Adaptive Resolution Selection</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={performanceOptions}
                  onChange={(e) => setPerformanceOptions(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Performance Options (Default: On)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={optimizationCache}
                  onChange={(e) => setOptimizationCache(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Optimization Cache</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={memoryOptimizations}
                  onChange={(e) => setMemoryOptimizations(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Memory Optimizations</span>
              </label>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? "Starting Detection..." : "Start Detection"}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/teams/${teamId}`)}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
