import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from './logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  boundaryName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary for React layout trees.
 * Captures render crash states and delegates them to the CRITICAL observability tier,
 * preventing cascading 'white screen of death' application crashes.
 */
export class SystemErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const boundary = this.props.boundaryName || 'RootBoundary';
    logger.critical(`React component tree crash in [${boundary}]`, error, {
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500 rounded-lg m-4">
          <h2 className="text-xl font-bold text-red-500 mb-2">System UI Crash Detected</h2>
          <p className="text-sm text-muted-foreground text-center">
            The application encountered a rendering error. This event has been logged to the system.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
