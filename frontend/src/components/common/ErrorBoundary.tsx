import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches React errors and shows a fallback so the app doesn’t blank. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
          <p className="text-[var(--color-text-primary)] font-medium mb-2">Something went wrong</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            We’ve recorded the error. Try refreshing the page.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-secondary mr-2 focus-ring"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary focus-ring"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
