import type { ReactNode } from 'react';
import { Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="hero-shell">
          <div className="hero-panel">
            <div className="eyebrow">Recovery Mode</div>
            <h1>NexusVault hit an unexpected rendering fault.</h1>
            <p className="hero-copy">
              Reload the page to restore the command deck. Local workspace data is still
              preserved in browser storage.
            </p>
            <button type="button" className="primary-action" onClick={() => window.location.reload()}>
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
