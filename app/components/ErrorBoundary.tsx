"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { logger } from "@/app/lib/logger";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Uncaught error in component tree", error, { 
      componentStack: errorInfo.componentStack 
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 rounded-xl border-2 border-dashed border-destructive/50 bg-destructive/5">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground max-w-sm">
            {this.state.error?.message || "An unexpected error occurred while rendering this component."}
          </p>
          <Button 
            variant="outline" 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
