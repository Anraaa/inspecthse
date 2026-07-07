package router

import (
	"net/http"

	"github.com/anomalyco/inspecthse/internal/config"
	"github.com/anomalyco/inspecthse/internal/handler"
	"github.com/anomalyco/inspecthse/internal/middleware"
	"github.com/anomalyco/inspecthse/internal/model"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func New(cfg *config.Config, authH *handler.AuthHandler, assetH *handler.AssetHandler, patrolH *handler.PatrolHandler, masterH *handler.MasterDataHandler, dashH *handler.DashboardHandler, exportH *handler.ExportHandler, alertH *handler.AlertHandler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RequestID)

	// Health check
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Public routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/login", authH.Login)
		r.Post("/auth/refresh", authH.Refresh)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(cfg))

			r.Post("/auth/logout", authH.Logout)

			// Scan QR
			r.Get("/scan/{qrCode}", assetH.GetByQRCode)

			// Dashboard
			r.Get("/dashboard/super-admin", dashH.SuperAdmin)
			r.Get("/dashboard/k3l", dashH.K3L)
			r.Get("/dashboard/tim-hse", dashH.TimHSE)

			// Patrol
			r.Post("/patrols", patrolH.Submit)
			r.Get("/patrols", patrolH.List)
			r.Get("/patrols/{id}", patrolH.GetByID)
			r.Post("/uploads", patrolH.UploadFile)

			// Alerts
			r.Get("/alerts", alertH.List)
			r.Get("/alerts/unread-count", alertH.UnreadCount)
			r.Put("/alerts/read-all", alertH.MarkAllAsRead)
			r.Put("/alerts/{id}/read", alertH.MarkAsRead)

			// Approval - HSE only
			r.Group(func(r chi.Router) {
				r.Use(middleware.RBACMiddleware(string(model.RoleTimHSE), string(model.RoleSuperAdmin)))
				r.Put("/patrols/{id}/approve", patrolH.Approve)
				r.Put("/patrols/{id}/reject", patrolH.Reject)
			})

			// Master data
			r.Route("/locations", func(r chi.Router) {
				r.Get("/", masterH.ListLocations)
				r.Get("/{id}", masterH.GetLocationByID)
				r.Post("/", masterH.CreateLocation)
				r.Put("/{id}", masterH.UpdateLocation)
				r.Delete("/{id}", masterH.DeleteLocation)
				r.Get("/{id}/qr", masterH.GenerateLocationQR)
			})

			r.Route("/sections", func(r chi.Router) {
				r.Get("/", masterH.ListSections)
				r.Post("/", masterH.CreateSection)
				r.Put("/{id}", masterH.UpdateSection)
				r.Delete("/{id}", masterH.DeleteSection)
			})

			r.Route("/shifts", func(r chi.Router) {
				r.Get("/", masterH.ListShifts)
				r.Post("/", masterH.CreateShift)
				r.Put("/{id}", masterH.UpdateShift)
				r.Delete("/{id}", masterH.DeleteShift)
			})

			r.Route("/parameters", func(r chi.Router) {
				r.Get("/", masterH.ListParameters)
				r.Post("/", masterH.CreateParameter)
				r.Put("/{id}", masterH.UpdateParameter)
				r.Delete("/{id}", masterH.DeleteParameter)
			})

			// Assets
			r.Route("/assets", func(r chi.Router) {
				r.Get("/", assetH.List)
				r.Get("/{id}", assetH.GetByID)
				r.Post("/", assetH.Create)
				r.Put("/{id}", assetH.Update)
				r.Delete("/{id}", assetH.Delete)
				r.Get("/{id}/qr", assetH.GenerateQR)
			})

			// Users - Super Admin only
			r.Group(func(r chi.Router) {
				r.Use(middleware.RBACMiddleware(string(model.RoleSuperAdmin)))
				r.Get("/users", masterH.ListUsers)
				r.Post("/users", masterH.CreateUser)
				r.Put("/users/{id}", masterH.UpdateUser)
				r.Put("/patrols/{id}/ghost-edit", patrolH.GhostEdit)
			})

			// Import template - all authenticated users
			r.Get("/import/template", exportH.DownloadImportTemplate)

			// Export - Super Admin only
			r.Group(func(r chi.Router) {
				r.Use(middleware.RBACMiddleware(string(model.RoleSuperAdmin)))
				r.Get("/export/checksheet", exportH.ExportChecksheet)
				r.Post("/import/assets", exportH.ImportAssets)
			})
		})
	})

	// Static uploads server
	fileServer := http.FileServer(http.Dir("./uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads", fileServer))

	return r
}
