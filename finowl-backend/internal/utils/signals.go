package utils

import (
	"os"
	"os/signal"
	"syscall"
)

// WaitForShutdown blocks until an interrupt signal is received.
func WaitForShutdown() {
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)
	<-signalChan
}
