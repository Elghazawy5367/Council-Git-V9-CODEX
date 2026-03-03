import React, { ErrorInfo } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "@/components/primitives/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

/**
 * Mobile-friendly, production-ready Error Fallback UI.
 * Designed for "The Council" with high-contrast, touch-friendly recovery actions.
 */
function ErrorFallback({
  error,
  resetErrorBoundary
}: FallbackProps) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in duration-500" role="alert">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-10 w-10" />
      </div>
      
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Systems Offline
      </h1>
      
      <p className="mb-8 max-w-md text-muted-foreground">
        A component in <span className="font-mono text-destructive tracking-tighter">The Council</span> encountered a critical failure. 
        We've logged the incident and isolated the crash.
      </p>

      {process.env.NODE_ENV === "development" && <pre className="mb-8 max-h-40 w-full max-w-lg overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono text-destructive border border-destructive/20">
          <code>{error.message}</code>
        </pre>}

      <div className="flex w-full max-w-xs flex-col gap-3 sm:flex-row sm:max-w-md">
        <Button variant="default" size="lg" onClick={resetErrorBoundary} className="flex-1 gap-2 min-h-[56px] text-lg sm:min-h-[44px] sm:text-base active:scale-95 transition-transform" data-testid="button-error-retry">
          <RefreshCw className="h-5 w-5" />
          Retry System
        </Button>
        
        <Button variant="outline" size="lg" onClick={() => window.location.href = "/"} className="flex-1 gap-2 min-h-[56px] text-lg sm:min-h-[44px] sm:text-base active:scale-95 transition-transform" data-testid="button-error-home">
          <Home className="h-5 w-5" />
          Full Reset
        </Button>
      </div>
    </div>;
}
const logError = (error: Error, info: ErrorInfo) => {
  // In production, send to Sentry/LogRocket here
  console.error("CRITICAL_UI_FAILURE:", error, info.componentStack);

  // Log structured error for production monitoring
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    name: error.name,
    stack: error.stack,
    componentStack: info.componentStack,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  console.error('[ErrorBoundary] Structured Error Log:', errorLog);

  // Check if error is recoverable
  const isRecoverable = !(error.message?.includes('chunk') || error.message?.includes('dynamically imported') || error.message?.includes('Failed to fetch'));
  if (!isRecoverable)
     { console.warn("Unrecoverable error detected"); }};
interface CustomErrorBoundaryProps {
  children: React.ReactNode;
}
const CustomErrorBoundary: React.FC<CustomErrorBoundaryProps> = ({
  children
}) => {
  return <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError} onReset={() => {
    // Preserve critical state before reset

    // Backup localStorage
    const backup: Record<string, string> = {};
    ['council_experts', 'council_memory', 'settings-storage'].forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) backup[key] = value;
    });

    // Clear only volatile state
    sessionStorage.clear();

    // Restore backed up state
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }}>
      {children}
    </ErrorBoundary>;
};
export default CustomErrorBoundary;

/**
 * Feature-specific Error Boundary
 * Isolates errors to individual features without crashing the whole app
 */
export const FeatureErrorBoundary: React.FC<{
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode;
}> = ({
  children,
  featureName,
  fallback
}) => {
  const defaultFallback = <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h3 className="font-semibold text-yellow-900">
            {featureName} Temporarily Unavailable
          </h3>
          <p className="text-sm text-yellow-700">
            This feature encountered an error. Other features continue working normally.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry Feature
      </Button>
    </div>;
  return <ErrorBoundary FallbackComponent={() => fallback || defaultFallback} onError={(error, info) => {
    console.error(`[${featureName}] Feature Error:`, error);
    logError(error, info);
  }} onReset={() => 
  { console.warn("Feature error boundary reset"); }}>
      {children}
    </ErrorBoundary>;};