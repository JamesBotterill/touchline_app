import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocialMedia } from "@/hooks/useSocialMedia";

export function SocialMediaManagement() {
  const navigate = useNavigate();
  const {
    platforms,
    loading,
    error,
    refetch,
    createPlatform,
    deletePlatform,
  } = useSocialMedia();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [baseReach, setBaseReach] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCreatePlatform = async () => {
    if (!newPlatformName.trim()) {
      setSaveError("Please enter a platform name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await createPlatform(
        newPlatformName,
        baseReach ? parseFloat(baseReach) : undefined,
        engagementRate ? parseFloat(engagementRate) : undefined
      );

      setSaveSuccess(true);
      setShowAddForm(false);
      setNewPlatformName("");
      setBaseReach("");
      setEngagementRate("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create platform");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlatform = async (platformId: number, platformName: string) => {
    if (!confirm(`Are you sure you want to delete platform "${platformName}"?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deletePlatform(platformId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete platform");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Media Management</h2>
          <p className="text-muted-foreground">
            Manage your social media platforms
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading platforms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Media Management</h2>
          <p className="text-muted-foreground">
            Manage your social media platforms
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                Error loading platforms: {error.message}
              </p>
              <Button onClick={refetch} size="sm" variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Media Management</h2>
          <p className="text-muted-foreground">
            {platforms.length} platform{platforms.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Platform"}
        </Button>
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

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Platform</CardTitle>
            <CardDescription>Create a new social media platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="platformName" className="text-sm font-medium">
                Platform Name
              </label>
              <input
                id="platformName"
                type="text"
                value={newPlatformName}
                onChange={(e) => setNewPlatformName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Instagram"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="baseReach" className="text-sm font-medium">
                  Base Reach (optional)
                </label>
                <input
                  id="baseReach"
                  type="number"
                  step="1"
                  value={baseReach}
                  onChange={(e) => setBaseReach(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="engagementRate" className="text-sm font-medium">
                  Engagement Rate (optional)
                </label>
                <input
                  id="engagementRate"
                  type="number"
                  step="0.01"
                  value={engagementRate}
                  onChange={(e) => setEngagementRate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button onClick={handleCreatePlatform} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Platform"}
            </Button>
          </CardContent>
        </Card>
      )}

      {platforms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No platforms found</p>
            <Button onClick={() => setShowAddForm(true)}>Create Your First Platform</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <Card key={platform.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{platform.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    #{platform.id}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    {platform.base_reach !== undefined && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Base Reach:</span>{" "}
                        <span className="font-medium">{platform.base_reach.toLocaleString()}</span>
                      </p>
                    )}
                    {platform.engagement_rate !== undefined && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Engagement Rate:</span>{" "}
                        <span className="font-medium">{platform.engagement_rate}%</span>
                      </p>
                    )}
                    {!platform.base_reach && !platform.engagement_rate && (
                      <p className="text-sm text-muted-foreground">No metrics configured</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/settings/social-media/${platform.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeletePlatform(platform.id, platform.name)}
                      disabled={isSaving}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
