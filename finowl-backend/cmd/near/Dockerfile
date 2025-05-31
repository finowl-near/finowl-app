FROM golang:1.23-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the NEAR server
RUN CGO_ENABLED=0 GOOS=linux go build -o near-server ./cmd/near

# Use a minimal alpine image for the final container
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=0 /app/near-server .

# Expose the NEAR server port
EXPOSE 8081

# Run the NEAR server
CMD ["./near-server"] 