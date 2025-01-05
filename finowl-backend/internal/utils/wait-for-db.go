package utils

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

func WaitForDB(dataSourceName string, maxAttempts int) error {
	var err error
	for i := 0; i < maxAttempts; i++ {
		db, err := sql.Open("postgres", dataSourceName)
		if err == nil {
			err = db.Ping()
			if err == nil {
				db.Close()
				return nil
			}
		}
		fmt.Printf("Waiting for database... Attempt %d/%d\n", i+1, maxAttempts)
		time.Sleep(time.Second * 2)
	}
	return fmt.Errorf("could not connect to database after %d attempts: %v", maxAttempts, err)

}
