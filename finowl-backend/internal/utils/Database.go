package utils

import (
	"database/sql"
	"fmt"

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
func InitDB(cfg DBConfig) (*sql.DB, error) {

	dataSourceName := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.DBName,
	)

	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	// Test the connection
	if err := WaitForDB(dataSourceName, 30); err != nil {
		return nil, fmt.Errorf("database connection failed: %v", err)
	}

	return db, nil
}

// NewDBConfig creates a new database configuration from environment variables
func NewDBConfig(envVars map[string]string) DBConfig {
	return DBConfig{
		Host:     envVars["dbHost"],
		Port:     envVars["dbPort"],
		User:     envVars["dbUser"],
		Password: envVars["dbPassword"],
		DBName:   envVars["dbName"],
	}
}
