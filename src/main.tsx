import React, { Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] p-6 text-[#111111]">
          <div className="max-w-md rounded-lg border border-black/15 bg-white p-6 text-center shadow-sm">
            <h1 className="font-display text-2xl font-semibold">
              L&rsquo;Oréal Smart Routine &amp; Product Advisor
            </h1>
            <p className="mt-2 text-sm text-[#5c5955]">
              Something went wrong while rendering the page: {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 cursor-pointer rounded-md bg-[#c8002e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff003b]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
