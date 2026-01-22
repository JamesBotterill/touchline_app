import { useEffect, useState } from "react";
import { useTouchline } from "./useTouchline";
import { useAppStore } from "../stores/appStore";

interface GeneralSettings {
  clubName: string;
  clubId: number | null;
  currency: string;
  currencySymbol: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export function useGeneralSettings() {
  const { isReady } = useTouchline();
  const { setCurrency, currencySymbol: storeCurrencySymbol, currency: storeCurrency } = useAppStore();
  const [clubName, setClubName] = useState("");
  const [clubId, setClubId] = useState<number | null>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch club name from config
      const clubNameResult = await window.api.touchline.sendCommand("configs.get", {
        category: "general",
        key: "club_name"
      });

      // Fetch currency settings
      const currencyResult = await window.api.touchline.sendCommand("configs.get_currency_config", {});

      // Fetch available currencies
      const currenciesResult = await window.api.touchline.sendCommand("configs.get_available_currencies", {});

      const currencyCode = currencyResult.data?.currency || "";
      const symbol = currencyResult.data?.symbol || "$";

      setClubName(clubNameResult.data?.value || "");

      // Update global store
      setCurrency(currencyCode, symbol);

      if (currenciesResult.success && currenciesResult.data) {
        setAvailableCurrencies(currenciesResult.data.currencies || []);
      }
    } catch (err) {
      console.error("Failed to fetch general settings:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const updateClubName = async (name: string) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("configs.set", {
        category: "general",
        key: "club_name",
        value: name
      });

      if (result.success) {
        setClubName(name);
        return true;
      } else {
        throw new Error(result.error || "Failed to update club name");
      }
    } catch (err) {
      console.error("Failed to update club name:", err);
      throw err;
    }
  };

  const updateCurrency = async (currency: string) => {
    if (!isReady) {
      throw new Error("Touchline not initialized");
    }

    try {
      const result = await window.api.touchline.sendCommand("configs.set_currency_symbol", {
        currency,
      });

      if (result.success) {
        // Refresh currency settings to get the new symbol
        const currencyResult = await window.api.touchline.sendCommand("configs.get_currency_config", {});

        if (currencyResult.success && currencyResult.data) {
          const currencyCode = currencyResult.data.currency || currency;
          const symbol = currencyResult.data.symbol || "$";

          // Update global store
          setCurrency(currencyCode, symbol);
        }
        return true;
      } else {
        throw new Error(result.error || "Failed to update currency");
      }
    } catch (err) {
      console.error("Failed to update currency:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (isReady) {
      fetchSettings();
    }
  }, [isReady]);

  return {
    settings: {
      clubName,
      clubId,
      currency: storeCurrency,
      currencySymbol: storeCurrencySymbol,
    },
    availableCurrencies,
    loading,
    error,
    refetch: fetchSettings,
    updateClubName,
    updateCurrency,
  };
}
