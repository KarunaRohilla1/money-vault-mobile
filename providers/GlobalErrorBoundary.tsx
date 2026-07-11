import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

import { ErrorView } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";

interface GlobalErrorBoundaryState {
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<PropsWithChildren, GlobalErrorBoundaryState> {
  public state: GlobalErrorBoundaryState = {
    error: null
  };

  public static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled application error", error, errorInfo.componentStack);
  }

  private readonly handleRetry = (): void => {
    this.setState({ error: null });
  };

  public render(): ReactNode {
    if (this.state.error) {
      return (
        <Screen scroll={false} contentClassName="flex-1 justify-center">
          <ErrorView
            title="Money Vault needs a reset"
            message={this.state.error.message}
            retryLabel="Retry"
            onRetry={this.handleRetry}
          />
        </Screen>
      );
    }

    return this.props.children;
  }
}
