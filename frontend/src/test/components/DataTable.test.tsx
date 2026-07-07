import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "@/components/master-data/DataTable";
import type { ColumnDef } from "@/lib/masterData";

const columns: ColumnDef[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email" },
];

const data = [
  { id: 1, name: "Alice", email: "alice@test.com" },
  { id: 2, name: "Bob", email: "bob@test.com" },
  { id: 3, name: "Charlie", email: "charlie@test.com" },
];

describe("DataTable", () => {
  const defaultProps = {
    columns,
    data,
    offset: 0,
    limit: 10,
    loading: false,
    search: "",
    onSearch: vi.fn(),
    onPage: vi.fn(),
  };

  it("renders column headers", () => {
    render(<DataTable {...defaultProps} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<DataTable {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<DataTable {...defaultProps} loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(<DataTable {...defaultProps} data={[]} />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<DataTable {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("shows total records count", () => {
    render(<DataTable {...defaultProps} total={100} />);
    expect(screen.getByText("100 records")).toBeInTheDocument();
  });

  it("renders edit button when onEdit provided", () => {
    render(<DataTable {...defaultProps} onEdit={vi.fn()} />);
    const editButtons = screen.getAllByText("Edit");
    expect(editButtons.length).toBe(3);
  });

  it("renders delete button when onDelete provided", () => {
    render(<DataTable {...defaultProps} onDelete={vi.fn()} />);
    const deleteButtons = screen.getAllByText("Delete");
    expect(deleteButtons.length).toBe(3);
  });
});
