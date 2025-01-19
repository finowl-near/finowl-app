package utils

import (
	"finowl-backend/pkg/storer"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

// DBConfig holds database configuration
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// InitDB initializes and returns a database connection
func InitDB(cfg DBConfig) (*storer.Storer, error) {

	dataSourceName := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.DBName,
	)

	// Wait for database to be ready
	if err := WaitForDB(dataSourceName, 30); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	storerClient, err := storer.NewStorer(dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("error initializing storer: %v", err)
	}

	storer.CreateTables(storerClient)

	return storerClient, nil
}

// NewDBConfig creates a new database configuration from environment variables
func NewDBConfig(config AppConfig) DBConfig {
	return DBConfig{
		Host:     config.DBHost,
		Port:     config.DBPort,
		User:     config.DBUser,
		Password: config.DBPassword,
		DBName:   config.DBName,
	}
}
