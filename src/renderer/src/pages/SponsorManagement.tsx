import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSponsors } from "@/hooks/useSponsors";

export function SponsorManagement() {
  const {
    sponsors,
    loading,
    error,
    refetch,
    createSponsor,
    deleteSponsor,
  } = useSponsors();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSponsorName, setNewSponsorName] = useState("");
  const [baseValue, setBaseValue] = useState("55.0");
  const [audienceMatch, setAudienceMatch] = useState("1.2");
  const [brandPower, setBrandPower] = useState("1.4");
  const [selectedLogos, setSelectedLogos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleSelectLogos = async () => {
    try {
      const filePaths = await window.api.files.selectFiles({
        multiple: true,
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }]
      });

      if (filePaths && filePaths.length > 0) {
        setSelectedLogos(prev => [...prev, ...filePaths]);
      }
    } catch (err) {
      console.error("Failed to select logos:", err);
      setSaveError("Failed to select logo files");
    }
  };

  const handleRemoveLogo = (index: number) => {
    setSelectedLogos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setSaveError("Please drop image files only");
      setTimeout(() => setSaveError(null), 3000);
      return;
    }

    try {
      // Read files as ArrayBuffers and send to main process to save
      const fileBuffers = await Promise.all(
        imageFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          return { name: file.name, buffer };
        })
      );

      const result = await window.api.files.saveFiles(fileBuffers);

      if (result.success && result.paths) {
        setSelectedLogos(prev => [...prev, ...result.paths!]);
      } else {
        throw new Error(result.error || "Failed to save files");
      }
    } catch (error) {
      console.error('Failed to process dropped files:', error);
      setSaveError(error instanceof Error ? error.message : "Failed to process dropped files");
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handleCreateSponsor = async () => {
    if (!newSponsorName.trim()) {
      setSaveError("Please enter a sponsor name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Copy logos to app data directory
      let copiedLogoPaths: string[] = [];
      if (selectedLogos.length > 0) {
        const result = await window.api.files.copyToAppData(selectedLogos);
        if (result.success) {
          copiedLogoPaths = result.paths;
        } else {
          throw new Error(result.error || "Failed to copy logo files");
        }
      }

      // Create sponsor with copied logo paths
      await createSponsor(
        newSponsorName,
        copiedLogoPaths,
        parseFloat(baseValue) || 0,
        parseFloat(audienceMatch) || 0,
        parseFloat(brandPower) || 0
      );

      setSaveSuccess(true);
      setShowAddForm(false);
      setNewSponsorName("");
      setBaseValue("55.0");
      setAudienceMatch("1.2");
      setBrandPower("1.4");
      setSelectedLogos([]);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create sponsor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSponsor = async (sponsorId: number, sponsorName: string) => {
    if (!confirm(`Are you sure you want to delete sponsor "${sponsorName}"?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteSponsor(sponsorId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete sponsor");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sponsor Management</h2>
          <p className="text-muted-foreground">
            Manage your sponsors
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading sponsors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sponsor Management</h2>
          <p className="text-muted-foreground">
            Manage your sponsors
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                Error loading sponsors: {error.message}
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
          <h2 className="text-3xl font-bold tracking-tight">Sponsor Management</h2>
          <p className="text-muted-foreground">
            {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Sponsor"}
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
            <CardTitle>Add New Sponsor</CardTitle>
            <CardDescription>Create a new sponsor with logo images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sponsorName" className="text-sm font-medium">
                Sponsor Name
              </label>
              <input
                id="sponsorName"
                type="text"
                value={newSponsorName}
                onChange={(e) => setNewSponsorName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Nike"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Sponsor Metrics</label>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-muted hover:bg-muted/80 transition-colors"
                title="Learn about sponsor metrics"
              >
                <span className="text-xs font-semibold text-muted-foreground">i</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="baseValue" className="text-sm font-medium">
                  Base Value
                </label>
                <input
                  id="baseValue"
                  type="number"
                  step="0.01"
                  value={baseValue}
                  onChange={(e) => setBaseValue(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="55.0"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="audienceMatch" className="text-sm font-medium">
                  Audience Match
                </label>
                <input
                  id="audienceMatch"
                  type="number"
                  step="0.01"
                  value={audienceMatch}
                  onChange={(e) => setAudienceMatch(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="1.2"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="brandPower" className="text-sm font-medium">
                  Brand Power
                </label>
                <input
                  id="brandPower"
                  type="number"
                  step="0.01"
                  value={brandPower}
                  onChange={(e) => setBrandPower(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="1.4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Logo Images</label>
              <div className="space-y-2">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="text-4xl">📁</div>
                    <p className="text-sm font-medium">Drag and drop logo images here</p>
                    <p className="text-xs text-muted-foreground">or</p>
                    <Button type="button" variant="outline" onClick={handleSelectLogos}>
                      Browse Files
                    </Button>
                  </div>
                </div>
                {selectedLogos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedLogos.length} file(s) selected:
                    </p>
                    <div className="space-y-1">
                      {selectedLogos.map((path, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted rounded px-3 py-2">
                          <span className="text-sm truncate flex-1">{path?.split(/[\\/]/).pop() || 'Unknown file'}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLogo(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleCreateSponsor} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Sponsor"}
            </Button>
          </CardContent>
        </Card>
      )}

      {sponsors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No sponsors found</p>
            <Button>Create Your First Sponsor</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{sponsor.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    #{sponsor.id}
                  </span>
                </CardTitle>
                <CardDescription>
                  {sponsor.logos && sponsor.logos.length > 0 ? (
                    <span>{sponsor.logos.length} logo(s)</span>
                  ) : (
                    <span className="text-muted-foreground">No logos</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Base Value:</span>{" "}
                      <span className="font-medium">{sponsor.base_value}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Audience Match:</span>{" "}
                      <span className="font-medium">{sponsor.audience_match}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Brand Power:</span>{" "}
                      <span className="font-medium">{sponsor.brand_power}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteSponsor(sponsor.id, sponsor.name)}
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

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInfoModal(false)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Understanding Sponsor Metrics</CardTitle>
              <CardDescription>How to determine Base Value, Brand Power, and Audience Match</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Base Value</h3>
                <p className="text-sm text-muted-foreground">
                  The fundamental worth of the sponsorship. Think of it as the "price tag" for exposure, independent of logo appearance quality.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>Research industry benchmarks and competitor deals</li>
                  <li>Consider the sponsor's marketing budget and goals</li>
                  <li>Example: Major brand in top-tier league = $150k/year</li>
                  <li>Example: Regional brand at local event = $10k/year</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Brand Power</h3>
                <p className="text-sm text-muted-foreground">
                  A multiplier reflecting brand strength and recognition. Scale where 1.0 = average brand.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>Assess brand awareness, perception, and loyalty</li>
                  <li>Consider market share and media coverage</li>
                  <li>2.0 = twice as powerful as average</li>
                  <li>Example: Nike = 1.8, Adidas = 1.6, Local brand = 0.5</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Audience Match</h3>
                <p className="text-sm text-muted-foreground">
                  A multiplier showing how well the sponsor's target audience aligns with the media's audience. Scale where 1.0 = perfect match.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>Compare demographics, interests, and behaviors</li>
                  <li>0.9 = excellent match, 0.5 = moderate, 0.2 = poor</li>
                  <li>Example: Sportswear + sports league = 0.9</li>
                  <li>Example: Baby products + sports league = 0.3</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowInfoModal(false)}>Got it</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
