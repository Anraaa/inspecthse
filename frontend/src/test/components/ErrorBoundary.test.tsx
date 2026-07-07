import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders error state when child throws", () => {
    const ThrowComponent = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Terjadi Kesalahan")).toBeInTheDocument();
    expect(screen.getByText("Coba Lagi")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const ThrowComponent = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });
});
