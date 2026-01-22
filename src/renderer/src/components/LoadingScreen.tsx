import { Card, CardContent } from "@/components/ui/card";

interface LoadingScreenProps {
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export function LoadingScreen({
  message = "Initializing Touchline Analytics...",
  error,
  onRetry,
}: LoadingScreenProps) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardContent className="pt-6">
          {error ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-2">
                <svg
                  className="h-12 w-12 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-semibold">Initialization Failed</h2>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {error.message}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="relative h-12 w-12">
                  <div className="absolute h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
                <h2 className="text-xl font-semibold">Loading</h2>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {message}
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="text-center">• Starting Python CLI...</p>
                <p className="text-center">• Establishing connection...</p>
                <p className="text-center">• Loading configuration...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
