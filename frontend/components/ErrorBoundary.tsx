"use client";

import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            minHeight: "200px",
            background: "#111111",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p
            style={{
              color: "#6b6b6b",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            Failed to load this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 20px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#e4e4e4",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
