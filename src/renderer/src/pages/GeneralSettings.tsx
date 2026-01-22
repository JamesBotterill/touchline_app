import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGeneralSettings } from "@/hooks/useGeneralSettings";

export function GeneralSettings() {
  const {
    settings,
    availableCurrencies,
    loading,
    error,
    refetch,
    updateClubName,
    updateCurrency,
  } = useGeneralSettings();

  const [clubName, setClubName] = useState("");
  const [currency, setCurrency] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings.clubName) {
      setClubName(settings.clubName);
    }
    if (settings.currency) {
      setCurrency(settings.currency);
    }
  }, [settings.clubName, settings.currency]);

  const handleSaveClubName = async () => {
    if (!clubName.trim()) {
      setSaveError("Club name cannot be empty");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateClubName(clubName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save club name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrency = async () => {
    if (!currency) {
      setSaveError("Please select a currency");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateCurrency(currency);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save currency");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">General Settings</h2>
          <p className="text-muted-foreground">
            Configure general application preferences
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">General Settings</h2>
          <p className="text-muted-foreground">
            Configure general application preferences
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                Error loading settings: {error.message}
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">General Settings</h2>
        <p className="text-muted-foreground">
          Configure general application preferences
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Club Name</CardTitle>
            <CardDescription>
              Set the name of your club
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="clubName" className="text-sm font-medium">
                Club Name
              </label>
              <input
                id="clubName"
                type="text"
                value={clubName || settings.clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter club name"
              />
            </div>
            <Button
              onClick={handleSaveClubName}
              disabled={isSaving || clubName === settings.clubName}
            >
              {isSaving ? "Saving..." : "Save Club Name"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              {settings.currency
                ? `Current: ${settings.currency} (${settings.currencySymbol})`
                : "Set the currency for financial calculations"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Currency
              </label>
              <select
                id="currency"
                value={currency || settings.currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select currency</option>
                {availableCurrencies
                  .filter((curr, index, self) =>
                    index === self.findIndex((c) => c.code === curr.code)
                  )
                  .map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name} ({curr.symbol})
                    </option>
                  ))}
              </select>
            </div>
            <Button
              onClick={handleSaveCurrency}
              disabled={isSaving || currency === settings.currency}
            >
              {isSaving ? "Saving..." : "Save Currency"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
