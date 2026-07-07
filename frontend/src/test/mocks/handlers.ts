import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/v1/sections", () => {
    return HttpResponse.json([
      { id: 1, name: "Produksi", description: "Bagian Produksi", created_at: "2024-01-01T00:00:00Z" },
      { id: 2, name: "Gudang", description: "Bagian Gudang", created_at: "2024-01-01T00:00:00Z" },
    ]);
  }),

  http.get("/api/v1/locations", () => {
    return HttpResponse.json([
      { id: 1, name: "Area A", description: "Lokasi A" },
      { id: 2, name: "Area B", description: "Lokasi B" },
    ]);
  }),

  http.get("/api/v1/shifts", () => {
    return HttpResponse.json([
      { id: 1, name: "Pagi", start_time: "07:00", end_time: "15:00" },
      { id: 2, name: "Siang", start_time: "15:00", end_time: "23:00" },
    ]);
  }),

  http.get("/api/v1/assets", () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          name: "APAR-001",
          asset_category: "APAR",
          serial_number: "SN-001",
          location_id: 1,
          is_active: true,
        },
      ],
      total: 1,
    });
  }),

  http.post("/api/v1/auth/login", () => {
    return HttpResponse.json({
      access_token: "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6IlNVUEVSX0FETUlOIn0.test",
      refresh_token: "refresh-test-token",
    });
  }),
];
