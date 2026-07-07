import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/EmptyState";
import { Inbox } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No data found" />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="There is no data to display" />);
    expect(screen.getByText("There is no data to display")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        title="No items"
        action={<button>Add Item</button>}
      />,
    );
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("renders custom icon", () => {
    const { container } = render(
      <EmptyState title="Test" icon={<Inbox data-testid="custom-icon" />} />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders default icon", () => {
    const { container } = render(<EmptyState title="Test" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
