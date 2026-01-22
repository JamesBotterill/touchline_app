import { useEffect, useState } from "react";

let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<void> | null = null;
const stateCallbacks: Set<() => void> = new Set();

// Notify all components when state changes
function notifyStateChange() {
  stateCallbacks.forEach(cb => cb());
}

export function useTouchline() {
  const [isInitializingState, setIsInitializing] = useState(!isInitialized);
  const [isReady, setIsReady] = useState(isInitialized);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to state changes
    const updateState = () => {
      setIsReady(isInitialized);
      setIsInitializing(isInitializing);
    };

    stateCallbacks.add(updateState);

    // If already initialized, update state immediately
    if (isInitialized) {
      setIsReady(true);
      setIsInitializing(false);
      return () => {
        stateCallbacks.delete(updateState);
      };
    }

    // If initialization is in progress, wait for it
    if (isInitializing && initPromise) {
      initPromise.then(() => {
        setIsReady(isInitialized);
        setIsInitializing(false);
      }).catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsInitializing(false);
      });
      return () => {
        stateCallbacks.delete(updateState);
      };
    }

    // Start initialization
    const initClient = async () => {
      isInitializing = true;
      setIsInitializing(true);
      setError(null);
      notifyStateChange();

      try {
        const result = await window.api.touchline.initialize();

        if (result.success) {
          isInitialized = true;
          setIsReady(true);
          notifyStateChange();
        } else {
          throw new Error(result.error || "Failed to initialize");
        }
      } catch (err) {
        console.error("Failed to initialize Touchline client:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        notifyStateChange();
        throw error;
      } finally {
        isInitializing = false;
        setIsInitializing(false);
        initPromise = null;
        notifyStateChange();
      }
    };

    initPromise = initClient();

    return () => {
      stateCallbacks.delete(updateState);
    };
  }, []);

  return { isInitializing: isInitializingState, isReady, error };
}
