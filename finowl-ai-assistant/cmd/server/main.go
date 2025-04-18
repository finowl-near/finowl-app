package main

import (
	"context"
	"finowl-ai-assistant/internal/app"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if present
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Create and initialize the application
	application, err := app.NewApp()
	if err != nil {
		log.Fatalf("❌ Failed to initialize application: %v", err)
	}

	// Ensure required directories exist
	if err := application.EnsureDirs(); err != nil {
		log.Fatalf("❌ Failed to create required directories: %v", err)
	}

	// Create HTTP server
	server := setupServer(application)

	// Start the server in a goroutine
	go startServer(server, application.Config.Server.Port)

	// Wait for shutdown signal
	waitForShutdown(server)
}

// setupServer creates and configures the HTTP server
func setupServer(application *app.App) *http.Server {
	// Create router and register handlers
	mux := http.NewServeMux()

	// AI analysis endpoint
	mux.HandleFunc("/analyze", application.Handler.AIAnalyzer)

	// Health check endpoint
	mux.HandleFunc("/health", application.Handler.HealthCheckHandler)

	// NEAR blockchain endpoints
	if application.APIHandler != nil {
		mux.HandleFunc("/create-conversation", application.APIHandler.CreateConversationHandler)
		mux.HandleFunc("/register", application.APIHandler.RegisterHandler)
	} else {
		// Add placeholder handlers when NEAR functionality is not available
		unavailableHandler := func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "NEAR blockchain functionality not available", http.StatusServiceUnavailable)
		}
		mux.HandleFunc("/create-conversation", unavailableHandler)
		mux.HandleFunc("/register", unavailableHandler)
	}

	log.Println("✅ HTTP routes configured")

	// Create and configure the server
	return &http.Server{
		Addr:         ":" + application.Config.Server.Port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

// startServer begins listening for requests
func startServer(server *http.Server, port string) {
	log.Printf("🚀 Server running on http://localhost:%s\n", port)
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("❌ HTTP server error: %v", err)
	}
}

// waitForShutdown gracefully shuts down the server when receiving termination signals
func waitForShutdown(server *http.Server) {
	// Create channel to receive OS signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Wait for termination signal
	<-stop

	log.Println("⚠️ Shutting down server...")

	// Create a deadline context for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Error during server shutdown: %v", err)
	}

	log.Println("✅ Server shutdown complete")
}
