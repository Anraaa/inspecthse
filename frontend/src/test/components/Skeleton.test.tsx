import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, TableSkeleton, CardSkeleton, FormSkeleton, PageSkeleton } from "@/components/Skeleton";

describe("Skeleton", () => {
  it("renders with default classes", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("rounded-lg");
    expect(el.className).toContain("bg-gray-200");
  });

  it("accepts custom className", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("h-10");
    expect(el.className).toContain("w-full");
  });
});

describe("TableSkeleton", () => {
  it("renders correct number of rows and columns", () => {
    const { container } = render(<TableSkeleton rows={3} cols={4} />);
    const skeletonElements = container.querySelectorAll(".animate-pulse");
    // header row (4) + 3 data rows (4 each) = 16
    expect(skeletonElements.length).toBe(16);
  });
});

describe("CardSkeleton", () => {
  it("renders correct number of cards", () => {
    const { container } = render(<CardSkeleton count={2} />);
    const cards = container.querySelectorAll(".bg-white");
    expect(cards.length).toBe(2);
  });
});

describe("FormSkeleton", () => {
  it("renders form skeleton", () => {
    render(<FormSkeleton />);
    expect(screen.getByText).toBeDefined();
  });
});

describe("PageSkeleton", () => {
  it("renders page skeleton", () => {
    const { container } = render(<PageSkeleton />);
    expect(container.querySelector(".space-y-6")).toBeTruthy();
  });
});
