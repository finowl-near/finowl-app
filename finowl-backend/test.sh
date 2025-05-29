#!/bin/bash

# Test script for finowl-backend
# Usage: ./test.sh [option]
# Options:
#   unit    - Run unit tests only
#   cover   - Run tests with coverage
#   bench   - Run benchmark tests
#   all     - Run all tests (default)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 FinOwl Backend Test Suite${NC}"
echo "=================================="

case "${1:-all}" in
  "unit")
    echo -e "${YELLOW}Running unit tests...${NC}"
    go test ./cmd/app -v -short
    ;;
  "cover")
    echo -e "${YELLOW}Running tests with coverage...${NC}"
    go test ./cmd/app -cover -coverprofile=coverage.out
    go tool cover -html=coverage.out -o coverage.html
    echo -e "${GREEN}✅ Coverage report generated: coverage.html${NC}"
    ;;
  "bench")
    echo -e "${YELLOW}Running benchmark tests...${NC}"
    go test ./cmd/app -bench=. -benchmem
    ;;
  "all")
    echo -e "${YELLOW}Running all tests...${NC}"
    go test ./cmd/app -v
    echo ""
    echo -e "${YELLOW}Running tests with coverage...${NC}"
    go test ./cmd/app -cover -coverprofile=coverage.out
    echo ""
    echo -e "${YELLOW}Running benchmark tests...${NC}"
    go test ./cmd/app -bench=. -benchmem
    echo ""
    echo -e "${GREEN}✅ All tests completed!${NC}"
    echo -e "📊 Coverage report: coverage.html"
    ;;
  *)
    echo -e "${RED}❌ Unknown option: $1${NC}"
    echo "Usage: $0 [unit|cover|bench|all]"
    exit 1
    ;;
esac

echo -e "${GREEN}✅ Tests completed successfully!${NC}" 