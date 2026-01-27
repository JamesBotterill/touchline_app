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

interface DetectionRun {
  id: number;
  team_id: number;
  team_name?: string;
  model_id: number;
  season_id: number;
  season_name?: string;
  input_file: string;
  output_file?: string;
  model_path: string;
  processing_time: number;
  medium: string;
  social_platform_id?: number;
  social_content_type_id?: number;
  post_type_id?: number;
  created_at: string;
  metrics_data?: string;
}

interface SponsorMetric {
  id: number;
  detection_run_id: number;
  sponsor_id: number;
  sponsor_name: string;
  appearances: number;
  avg_quality: number;
  total_seconds: number;
  total_value: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagement_rate?: number;
  engagement_value?: number;
  visibility_value?: number;
  brand_value?: number;
  base_component_value?: number | null;
  weighted_engagement?: number;
  cpm_rate_used?: number;
  avg_engagement_rate_used?: number;
  relative_size?: number;
  detected_frames?: number;
  total_frames_estimated?: number;
  video_fps?: number;
}


interface DetectionRunDetails {
  detection_run: DetectionRun & {
    metrics?: SponsorMetric[];
  };
  platform_name?: string;
  content_type_name?: string;
  post_type_name?: string;
}

export function DetectionResults() {
  const { teamId, runId } = useParams<{ teamId: string; runId: string }>();
  const navigate = useNavigate();
  const { isReady } = useTouchline();

  const [detectionData, setDetectionData] = useState<DetectionRunDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [videoDataUrl, setVideoDataUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  // Editable engagement metrics
  const [views, setViews] = useState<string>("");
  const [likes, setLikes] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [shares, setShares] = useState<string>("");
  const [saves, setSaves] = useState<string>("");
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [isSavingMetrics, setIsSavingMetrics] = useState(false);

  const fetchDetectionResults = async () => {
    if (!isReady || !runId) return;

    setLoading(true);
    setError(null);

    try {
      // Check if runId is a task_id (starts with "detection_") or a numeric run_id
      const isTaskId = runId.startsWith("detection_");

      let runResult;

      if (isTaskId) {
        // Poll task status for async detection
        runResult = await window.api.touchline.sendCommand("detections.get_task_status", {
          task_id: runId
        });

        console.log("[DetectionResults] Task status response:", JSON.stringify(runResult, null, 2));

        if (!runResult.success) {
          throw new Error(runResult.error || "Failed to fetch task status");
        }

        // If task is still running, show progress and poll again
        if (runResult.data.is_running || !runResult.data.completed) {
          console.log("[DetectionResults] Task still running, polling again...");
          setLoading(true);
          setTimeout(fetchDetectionResults, 2000); // Poll every 2 seconds
          return;
        }

        console.log("[DetectionResults] Task completed!");

        // Task is complete - check if it was auto-recorded
        if (!runResult.data.result) {
          throw new Error("Detection task completed but no result available");
        }

        console.log("[DetectionResults] Full task result:", JSON.stringify(runResult, null, 2));

        // Check if the backend auto-recorded this detection (new flow)
        if (runResult.data.result.detection_run_id) {
          // Navigate to the database-stored run using the detection_run_id
          console.log("[DetectionResults] Detection was auto-recorded with run_id:", runResult.data.result.detection_run_id);
          navigate(`/teams/${teamId}/detections/${runResult.data.result.detection_run_id}`, { replace: true });
          return;
        }

        // If no detection_run_id, the detection was not auto-recorded (old flow or missing team_id)
        throw new Error("Detection completed but was not recorded to database. Please ensure team_id is provided.");
      } else {
        // Get detection run details from database using metrics.get_run
        runResult = await window.api.touchline.sendCommand("metrics.get_run", {
          run_id: parseInt(runId)
        });

        console.log("[DetectionResults] metrics.get_run response:", JSON.stringify(runResult, null, 2));
      }

      if (!runResult.success || !runResult.data?.detection_run) {
        console.error("[DetectionResults] Invalid response structure:", runResult);
        throw new Error(runResult.error || "Failed to fetch detection run");
      }

      const runData: DetectionRunDetails = {
        detection_run: runResult.data.detection_run
      };

      // Fetch season name if available
      if (runData.detection_run.season_id) {
        const seasonResult = await window.api.touchline.sendCommand("seasons.get", {
          season_id: runData.detection_run.season_id
        });
        if (seasonResult.success && seasonResult.data?.season) {
          runData.detection_run.season_name = seasonResult.data.season.name;
        }
      }

      // Fetch platform name if social media
      if (runData.detection_run.social_platform_id) {
        const platformResult = await window.api.touchline.sendCommand("social_media.get_platform", {
          platform_id: runData.detection_run.social_platform_id
        });
        if (platformResult.success && platformResult.data?.platform) {
          runData.platform_name = platformResult.data.platform.name;
        }
      }

      // Fetch content type name if social media
      if (runData.detection_run.social_content_type_id && runData.detection_run.social_platform_id) {
        const contentTypeResult = await window.api.touchline.sendCommand("social_media.get_content_types", {
          platform_id: runData.detection_run.social_platform_id
        });
        if (contentTypeResult.success && contentTypeResult.data?.content_types) {
          const contentType = contentTypeResult.data.content_types.find(
            (ct: any) => ct.id === runData.detection_run.social_content_type_id
          );
          if (contentType) {
            runData.content_type_name = contentType.name;
          }
        }
      }

      // Fetch post type name if available
      if (runData.detection_run.post_type_id) {
        const postTypeResult = await window.api.touchline.sendCommand("post_types.get", {
          post_type_id: runData.detection_run.post_type_id
        });
        if (postTypeResult.success && postTypeResult.data?.post_type) {
          runData.post_type_name = postTypeResult.data.post_type.name;
        }
      }

      setDetectionData(runData);

      // Set engagement metrics from the first metric (they should all have the same values)
      const firstMetric = runData.detection_run.metrics?.[0];
      if (firstMetric) {
        setViews(firstMetric.views?.toString() || "");
        setLikes(firstMetric.likes?.toString() || "");
        setComments(firstMetric.comments?.toString() || "");
        setShares(firstMetric.shares?.toString() || "");
        setSaves(firstMetric.saves?.toString() || "");
      }

      // Load the output file as a data URL
      if (runData.detection_run.output_file) {
        try {
          console.log("[DetectionResults] Loading output file:", runData.detection_run.output_file);
          console.log("[DetectionResults] Medium type:", runData.detection_run.medium);

          // Check if it's a video file
          const filePath = runData.detection_run.output_file.toLowerCase();
          const isVideo = filePath.endsWith('.mp4') ||
                        filePath.endsWith('.mov') ||
                        filePath.endsWith('.avi') ||
                        filePath.endsWith('.webm');

          if (isVideo) {
            // Use file:// protocol directly since webSecurity is disabled
            // Ensure proper formatting: file:// + absolute path (starts with / on macOS/Linux) -> file:///path
            let rawPath = runData.detection_run.output_file;
            // Normalize slashes for Windows compatibility
            rawPath = rawPath.replace(/\\/g, '/');
            
            const videoPath = rawPath.startsWith('/') ? `file://${rawPath}` : `file:///${rawPath}`;
            
            console.log("[DetectionResults] Video path:", videoPath);
            setVideoDataUrl(videoPath);
          } else {
            // For images, use base64 encoding
            const fileResult = await window.api.files.getLocalFile(runData.detection_run.output_file);
            if (fileResult.success && fileResult.data && fileResult.mimeType) {
              const dataUrl = `data:${fileResult.mimeType};base64,${fileResult.data}`;
              setImageDataUrl(dataUrl);
            }
          }
        } catch (err) {
          console.error("Failed to load output file:", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch detection results:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetrics = async () => {
    if (!detectionData) return;

    setIsSavingMetrics(true);

    try {
      // Update social media metrics for each sponsor using metrics.store_social_metrics
      const metrics = detectionData.detection_run.metrics || [];
      for (const metric of metrics) {
        await window.api.touchline.sendCommand("metrics.store_social_metrics", {
          detection_run_id: parseInt(runId!),
          sponsor_id: metric.sponsor_id,
          views: parseInt(views) || undefined,
          likes: parseInt(likes) || undefined,
          comments: parseInt(comments) || undefined,
          shares: parseInt(shares) || undefined,
          saves: parseInt(saves) || undefined,
        });

        // Recalculate social value using metrics.calculate_social_value
        await window.api.touchline.sendCommand("metrics.calculate_social_value", {
          detection_run_id: parseInt(runId!),
          sponsor_id: metric.sponsor_id,
        });
      }

      // Refresh data to show updated values
      await fetchDetectionResults();
      setIsEditingMetrics(false);
    } catch (err) {
      console.error("Failed to update metrics:", err);
    } finally {
      setIsSavingMetrics(false);
    }
  };

  useEffect(() => {
    if (isReady && runId) {
      fetchDetectionResults();
    }

    // Cleanup object URLs when component unmounts
    return () => {
      if (videoDataUrl && videoDataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoDataUrl);
      }
      if (imageDataUrl && imageDataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageDataUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, runId]);

  if (loading) {
    const isTaskId = runId?.startsWith("detection_");
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/teams/${teamId}`)}>
            ← Back to Team Metrics
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Detection Results</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">
              {isTaskId ? "Detection in progress... This may take a few minutes." : "Loading detection results..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !detectionData) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/teams/${teamId}`)}>
            ← Back to Team Metrics
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Detection Results</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error?.message || "Detection results not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const run = detectionData.detection_run;

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => navigate(`/teams/${teamId}`)}>
          ← Back to Team Metrics
        </Button>
        <h2 className="text-3xl font-bold tracking-tight mt-4">Detection Results</h2>
        <p className="text-muted-foreground">
          View detection details and sponsor metrics
        </p>
      </div>

      {/* Detection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {new Date(run.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Season</p>
              <p className="font-medium">{run.season_name || `Season #${run.season_id}`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processing Time</p>
              <p className="font-medium">{run.processing_time.toFixed(2)}s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medium</p>
              <p className="font-medium capitalize">{run.medium}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Input File</p>
            <p className="font-medium text-sm font-mono break-all">
              {run.input_file}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detection Output Video/Image */}
      {run.output_file && (
        <Card>
          <CardHeader>
            <CardTitle>Detection Output {videoDataUrl ? 'Video' : 'Image'}</CardTitle>
            <CardDescription>
              {videoDataUrl ? 'Video' : 'Image'} with detected sponsors highlighted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              {videoDataUrl ? (
                <video
                  controls
                  className="w-full h-full rounded-lg"
                  src={videoDataUrl}
                  onError={(e) => {
                    const target = e.target as HTMLVideoElement;
                    console.error('[Video] Error loading video:', e);
                    console.error('[Video] Video src:', videoDataUrl);
                    console.error('[Video] Error details:', target.error);
                    console.error('[Video] Error message:', target.error?.message);
                    if (target.error?.message?.includes('DEMUXER_ERROR_NO_SUPPORTED_STREAMS')) {
                      console.error('[Video] This error usually indicates an unsupported codec (e.g. H.265) or malformed file path.');
                    }
                  }}
                  onLoadStart={() => console.log('[Video] Load started')}
                  onLoadedMetadata={() => console.log('[Video] Metadata loaded')}
                  onCanPlay={() => console.log('[Video] Can play')}
                >
                  Your browser does not support the video tag.
                </video>
              ) : imageDataUrl ? (
                <img
                  src={imageDataUrl}
                  alt="Detection output"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading media...</p>
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Output Path:</p>
              <p className="text-sm font-mono break-all">{run.output_file}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Media Metrics */}
      {(run.social_platform_id || run.social_content_type_id) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Social Media Metrics</span>
              {!isEditingMetrics ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingMetrics(true)}
                >
                  Edit Metrics
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingMetrics(false);
                      // Reset values
                      const firstMetric = detectionData.detection_run.metrics?.[0];
                      if (firstMetric) {
                        setViews(firstMetric.views?.toString() || "");
                        setLikes(firstMetric.likes?.toString() || "");
                        setComments(firstMetric.comments?.toString() || "");
                        setShares(firstMetric.shares?.toString() || "");
                        setSaves(firstMetric.saves?.toString() || "");
                      }
                    }}
                    disabled={isSavingMetrics}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveMetrics}
                    disabled={isSavingMetrics}
                  >
                    {isSavingMetrics ? "Saving..." : "Save & Recalculate"}
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Platform and engagement statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="font-medium">{detectionData.platform_name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Content Type</p>
                <p className="font-medium">{detectionData.content_type_name || "Unknown"}</p>
              </div>
              {detectionData.detection_run.metrics?.[0]?.engagement_rate !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="font-medium">{detectionData.detection_run.metrics[0].engagement_rate.toFixed(4)}%</p>
                </div>
              )}
              {detectionData.detection_run.metrics?.[0]?.cpm_rate_used !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">CPM Rate</p>
                  <p className="font-medium">£{detectionData.detection_run.metrics[0].cpm_rate_used.toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Engagement Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Views</label>
                  {isEditingMetrics ? (
                    <input
                      type="number"
                      value={views}
                      onChange={(e) => setViews(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="font-medium">{views || "0"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Likes</label>
                  {isEditingMetrics ? (
                    <input
                      type="number"
                      value={likes}
                      onChange={(e) => setLikes(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="font-medium">{likes || "0"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comments</label>
                  {isEditingMetrics ? (
                    <input
                      type="number"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="font-medium">{comments || "0"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shares</label>
                  {isEditingMetrics ? (
                    <input
                      type="number"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="font-medium">{shares || "0"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saves</label>
                  {isEditingMetrics ? (
                    <input
                      type="number"
                      value={saves}
                      onChange={(e) => setSaves(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="font-medium">{saves || "0"}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sponsor Detections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Detections</CardTitle>
          <CardDescription>
            Detailed breakdown of detected sponsors and their values
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!detectionData.detection_run.metrics || detectionData.detection_run.metrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-muted-foreground">No sponsor detections found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Sponsor</th>
                    <th className="text-right p-4 font-medium">Avg Quality</th>
                    <th className="text-right p-4 font-medium">Duration (s)</th>
                    <th className="text-right p-4 font-medium">Screen %</th>
                    <th className="text-right p-4 font-medium">Appearances</th>
                    <th className="text-right p-4 font-medium">Sponsorship Value</th>
                    <th className="text-right p-4 font-medium">Social Value</th>
                    <th className="text-right p-4 font-medium">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {detectionData.detection_run.metrics.map((metric) => (
                    <tr key={metric.sponsor_id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{metric.sponsor_name}</td>
                      <td className="p-4 text-right">{metric.avg_quality.toFixed(2)}</td>
                      <td className="p-4 text-right">{metric.total_seconds.toFixed(1)}s</td>
                      <td className="p-4 text-right">{((metric.relative_size || 0) * 100).toFixed(1)}%</td>
                      <td className="p-4 text-right">{metric.appearances}</td>
                      <td className="p-4 text-right font-medium">
                        £{(metric.visibility_value || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-medium">
                        £{(metric.engagement_value || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-medium">
                        £{metric.total_value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-muted/30">
                  <tr>
                    <td className="p-4 font-bold" colSpan={7}>Total Value</td>
                    <td className="p-4 text-right font-bold">
                      £
                      {(detectionData.detection_run.metrics || [])
                        .reduce((sum, m) => sum + m.total_value, 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
