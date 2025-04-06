package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Placeholder handler for /create-conversation
	http.HandleFunc("/create-conversation", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "/create-conversation not yet implemented")
	})

	// Placeholder handler for /register
	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, " /register not yet implemented")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
