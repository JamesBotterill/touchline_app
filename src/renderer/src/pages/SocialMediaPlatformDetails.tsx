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
import { useAppStore } from "@/stores/appStore";
import type { SocialMediaPlatform } from "@/lib/touchline/types";

interface ContentType {
  id: number;
  platform_id: number;
  name: string;
  description?: string;
}

interface SocialParameter {
  id: number;
  platform_id: number;
  content_type_id?: number | null;
  parameter_type: string;
  parameter_key: string;
  parameter_value: number;
  description?: string;
}

export function SocialMediaPlatformDetails() {
  const { platformId } = useParams<{ platformId: string }>();
  const navigate = useNavigate();
  const { isReady } = useTouchline();
  const { currencySymbol } = useAppStore();

  const [platform, setPlatform] = useState<SocialMediaPlatform | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [parameters, setParameters] = useState<SocialParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Content Type Form
  const [showAddContentType, setShowAddContentType] = useState(false);
  const [newContentTypeName, setNewContentTypeName] = useState("");
  const [newContentTypeDescription, setNewContentTypeDescription] = useState("");

  // Parameter Form
  const [showAddParameter, setShowAddParameter] = useState(false);
  const [newParameterType, setNewParameterType] = useState("");
  const [newParameterKey, setNewParameterKey] = useState("");
  const [newParameterValue, setNewParameterValue] = useState("");
  const [newParameterContentTypeId, setNewParameterContentTypeId] = useState("");

  // Edit Parameter
  const [editingParameterId, setEditingParameterId] = useState<number | null>(null);
  const [editParameterValue, setEditParameterValue] = useState("");

  // Edit Content Type CPM
  const [editingContentTypeId, setEditingContentTypeId] = useState<number | null>(null);
  const [editContentTypeCPM, setEditContentTypeCPM] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPlatformDetails = async () => {
    if (!isReady || !platformId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch platform details
      const platformResult = await window.api.touchline.sendCommand("social_media.get_platform", {
        platform_id: parseInt(platformId)
      });

      if (platformResult.success && platformResult.data) {
        setPlatform(platformResult.data.platform || null);
      }

      // Fetch content types
      const contentTypesResult = await window.api.touchline.sendCommand("social_media.get_content_types", {
        platform_id: parseInt(platformId)
      });

      if (contentTypesResult.success && contentTypesResult.data) {
        setContentTypes(contentTypesResult.data.content_types || []);
      }

      // Fetch parameters
      const parametersResult = await window.api.touchline.sendCommand("social_media.get_parameters", {
        platform_id: parseInt(platformId)
      });

      if (parametersResult.success && parametersResult.data) {
        setParameters(parametersResult.data.parameters || []);
      }
    } catch (err) {
      console.error("Failed to fetch platform details:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContentType = async () => {
    if (!newContentTypeName.trim() || !platformId) {
      setSaveError("Please enter a content type name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("social_media.create_content_type", {
        platform_id: parseInt(platformId),
        name: newContentTypeName,
        description: newContentTypeDescription || undefined
      });

      if (result.success) {
        setSaveSuccess(true);
        setShowAddContentType(false);
        setNewContentTypeName("");
        setNewContentTypeDescription("");
        await fetchPlatformDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to create content type");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create content type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateParameter = async () => {
    if (!newParameterType.trim() || !newParameterKey.trim() || !platformId) {
      setSaveError("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("social_media.create_parameter", {
        platform_id: parseInt(platformId),
        content_type_id: newParameterContentTypeId ? parseInt(newParameterContentTypeId) : null,
        parameter_type: newParameterType,
        parameter_key: newParameterKey,
        parameter_value: parseFloat(newParameterValue) || 0
      });

      if (result.success) {
        setSaveSuccess(true);
        setShowAddParameter(false);
        setNewParameterType("");
        setNewParameterKey("");
        setNewParameterValue("");
        setNewParameterContentTypeId("");
        await fetchPlatformDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to create parameter");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create parameter");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateParameter = async (parameterId: number) => {
    if (!editParameterValue.trim()) {
      setSaveError("Please enter a value");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("social_media.update_parameter", {
        parameter_id: parameterId,
        parameter_value: parseFloat(editParameterValue)
      });

      if (result.success) {
        setSaveSuccess(true);
        setEditingParameterId(null);
        setEditParameterValue("");
        await fetchPlatformDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to update parameter");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update parameter");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingParameter = (parameter: SocialParameter) => {
    setEditingParameterId(parameter.id);
    setEditParameterValue(parameter.parameter_value.toString());
  };

  const cancelEditingParameter = () => {
    setEditingParameterId(null);
    setEditParameterValue("");
  };

  const getCPMForContentType = (contentTypeId: number): number | null => {
    const cpmParam = parameters.find(
      p => p.content_type_id === contentTypeId &&
           p.parameter_type === "cpm" &&
           p.parameter_key === "base_rate"
    );
    return cpmParam ? cpmParam.parameter_value : null;
  };

  const getCPMParameterIdForContentType = (contentTypeId: number): number | null => {
    const cpmParam = parameters.find(
      p => p.content_type_id === contentTypeId &&
           p.parameter_type === "cpm" &&
           p.parameter_key === "base_rate"
    );
    return cpmParam ? cpmParam.id : null;
  };

  const handleUpdateContentTypeCPM = async (contentTypeId: number) => {
    if (!editContentTypeCPM.trim()) {
      setSaveError("Please enter a CPM value");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const existingCPMParamId = getCPMParameterIdForContentType(contentTypeId);

      if (existingCPMParamId) {
        // Update existing parameter
        const result = await window.api.touchline.sendCommand("social_media.update_parameter", {
          parameter_id: existingCPMParamId,
          parameter_value: parseFloat(editContentTypeCPM)
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to update CPM");
        }
      } else {
        // Create new parameter
        const result = await window.api.touchline.sendCommand("social_media.create_parameter", {
          platform_id: parseInt(platformId!),
          content_type_id: contentTypeId,
          parameter_type: "cpm",
          parameter_key: "base_rate",
          parameter_value: parseFloat(editContentTypeCPM),
          description: "CPM base rate"
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to create CPM");
        }
      }

      setSaveSuccess(true);
      setEditingContentTypeId(null);
      setEditContentTypeCPM("");
      await fetchPlatformDetails();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update CPM");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingContentTypeCPM = (contentTypeId: number) => {
    const currentCPM = getCPMForContentType(contentTypeId);
    setEditingContentTypeId(contentTypeId);
    setEditContentTypeCPM(currentCPM !== null ? currentCPM.toString() : "0");
  };

  const cancelEditingContentTypeCPM = () => {
    setEditingContentTypeId(null);
    setEditContentTypeCPM("");
  };

  const handleDeleteContentType = async (contentTypeId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete content type "${name}"?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await window.api.touchline.sendCommand("social_media.delete_content_type", {
        content_type_id: contentTypeId
      });

      if (result.success) {
        setSaveSuccess(true);
        await fetchPlatformDetails();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to delete content type");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete content type");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isReady && platformId) {
      fetchPlatformDetails();
    }
  }, [isReady, platformId]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate("/settings/social-media")}>
            ← Back to Platforms
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Platform Details</h2>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading platform details...</p>
        </div>
      </div>
    );
  }

  if (error || !platform) {
    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate("/settings/social-media")}>
            ← Back to Platforms
          </Button>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Platform Details</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error?.message || "Platform not found"}
            </p>
            <Button onClick={() => navigate("/settings/social-media")} className="mt-4">
              Back to Platforms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => navigate("/settings/social-media")}>
          ← Back to Platforms
        </Button>
        <h2 className="text-3xl font-bold tracking-tight mt-4">{platform.name}</h2>
        <p className="text-muted-foreground">
          Manage content types and parameters for this platform
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

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Platform ID:</span>{" "}
              <span className="font-medium">#{platform.id}</span>
            </p>
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
          </div>
        </CardContent>
      </Card>

      {/* Content Types Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Content Types</h3>
          <Button onClick={() => setShowAddContentType(!showAddContentType)}>
            {showAddContentType ? "Cancel" : "Add Content Type"}
          </Button>
        </div>

        {showAddContentType && (
          <Card>
            <CardHeader>
              <CardTitle>Add Content Type</CardTitle>
              <CardDescription>Create a new content type for this platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="contentTypeName" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="contentTypeName"
                  type="text"
                  value={newContentTypeName}
                  onChange={(e) => setNewContentTypeName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Post, Story, Reel"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contentTypeDescription" className="text-sm font-medium">
                  Description (optional)
                </label>
                <input
                  id="contentTypeDescription"
                  type="text"
                  value={newContentTypeDescription}
                  onChange={(e) => setNewContentTypeDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Brief description"
                />
              </div>

              <Button onClick={handleCreateContentType} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Content Type"}
              </Button>
            </CardContent>
          </Card>
        )}

        {contentTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-muted-foreground mb-4">No content types found</p>
              <Button onClick={() => setShowAddContentType(true)}>Add First Content Type</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {contentTypes.map((contentType) => {
              const currentCPM = getCPMForContentType(contentType.id);
              const isEditing = editingContentTypeId === contentType.id;

              return (
                <Card key={contentType.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{contentType.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        #{contentType.id}
                      </span>
                    </CardTitle>
                    {contentType.description && (
                      <CardDescription>{contentType.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CPM (Cost Per Mille)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editContentTypeCPM}
                            onChange={(e) => setEditContentTypeCPM(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="0.00"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateContentTypeCPM(contentType.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save CPM"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditingContentTypeCPM}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-lg border p-3 bg-muted/50">
                          <p className="text-sm font-medium mb-1">CPM (Cost Per Mille)</p>
                          <p className="text-lg font-bold">
                            {currentCPM !== null ? `${currencySymbol}${currentCPM.toFixed(2)}` : "Not set"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingContentTypeCPM(contentType.id)}
                            className="flex-1"
                          >
                            {currentCPM !== null ? "Edit CPM" : "Set CPM"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContentType(contentType.id, contentType.name)}
                            disabled={isSaving}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Parameters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Parameters</h3>
          <Button onClick={() => setShowAddParameter(!showAddParameter)}>
            {showAddParameter ? "Cancel" : "Add Parameter"}
          </Button>
        </div>

        {showAddParameter && (
          <Card>
            <CardHeader>
              <CardTitle>Add Parameter</CardTitle>
              <CardDescription>Create a new parameter for this platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="parameterType" className="text-sm font-medium">
                    Parameter Type
                  </label>
                  <input
                    id="parameterType"
                    type="text"
                    value={newParameterType}
                    onChange={(e) => setNewParameterType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., engagement, reach"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="parameterKey" className="text-sm font-medium">
                    Parameter Key
                  </label>
                  <input
                    id="parameterKey"
                    type="text"
                    value={newParameterKey}
                    onChange={(e) => setNewParameterKey(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., multiplier, rate"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="parameterValue" className="text-sm font-medium">
                    Value
                  </label>
                  <input
                    id="parameterValue"
                    type="number"
                    step="0.01"
                    value={newParameterValue}
                    onChange={(e) => setNewParameterValue(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="parameterContentType" className="text-sm font-medium">
                    Content Type (optional)
                  </label>
                  <select
                    id="parameterContentType"
                    value={newParameterContentTypeId}
                    onChange={(e) => setNewParameterContentTypeId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">None</option>
                    {contentTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={handleCreateParameter} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Parameter"}
              </Button>
            </CardContent>
          </Card>
        )}

        {parameters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-muted-foreground mb-4">No parameters found</p>
              <Button onClick={() => setShowAddParameter(true)}>Add First Parameter</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parameters
              .filter(parameter => !(parameter.parameter_type === "cpm" && parameter.parameter_key === "base_rate"))
              .map((parameter) => {
              const contentTypeName = parameter.content_type_id
                ? contentTypes.find(ct => ct.id === parameter.content_type_id)?.name
                : null;

              return (
                <Card key={parameter.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{parameter.parameter_type}</CardTitle>
                    <CardDescription>
                      {parameter.parameter_key}
                      {contentTypeName && (
                        <span className="ml-2">
                          ({contentTypeName})
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingParameterId === parameter.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Value</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editParameterValue}
                            onChange={(e) => setEditParameterValue(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateParameter(parameter.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditingParameter}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Value:</span>{" "}
                          <span className="font-medium">{parameter.parameter_value}</span>
                        </p>
                        {parameter.description && (
                          <p className="text-xs text-muted-foreground">{parameter.description}</p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditingParameter(parameter)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
