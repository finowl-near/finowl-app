# Dockerfile for finowl-ai-assistant
FROM golang:1.23-alpine

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the entire project
COPY . .

# Build the application
RUN go build -o /finowl-ai-assistant ./cmd/server

# Command to run the application with mainnet flag
CMD ["/finowl-ai-assistant", "-network", "mainnet"] 