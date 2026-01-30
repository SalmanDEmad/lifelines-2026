#!/bin/bash

# Amal Platform - Run All Services
# This script starts the mobile app, backend, and NGO dashboard

echo "========================================="
echo "       Amal Platform - Starting All     "
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Backend (if it exists)
if [ -d "$SCRIPT_DIR/rubble-report-backend" ]; then
    echo -e "${YELLOW}Starting Backend...${NC}"
    cd "$SCRIPT_DIR/rubble-report-backend"
    npm install --silent 2>/dev/null
    npm run dev &
    BACKEND_PID=$!
    echo -e "${GREEN}Backend started (PID: $BACKEND_PID) on port 3001${NC}"
else
    echo -e "${YELLOW}Backend directory not found, skipping...${NC}"
fi

# Start NGO Dashboard
if [ -d "$SCRIPT_DIR/ngo-dashboard" ]; then
    echo -e "${YELLOW}Starting NGO Dashboard...${NC}"
    cd "$SCRIPT_DIR/ngo-dashboard"
    npm install --silent 2>/dev/null
    npm run dev &
    DASHBOARD_PID=$!
    echo -e "${GREEN}NGO Dashboard started (PID: $DASHBOARD_PID) on port 3002${NC}"
else
    echo -e "${RED}NGO Dashboard directory not found!${NC}"
fi

# Start Mobile App (Expo)
if [ -d "$SCRIPT_DIR/rubble-report-mobile" ]; then
    echo -e "${YELLOW}Starting Mobile App (Expo)...${NC}"
    cd "$SCRIPT_DIR/rubble-report-mobile"
    npm install --silent 2>/dev/null
    npx expo start &
    MOBILE_PID=$!
    echo -e "${GREEN}Mobile App started (PID: $MOBILE_PID)${NC}"
else
    echo -e "${RED}Mobile App directory not found!${NC}"
fi

echo ""
echo "========================================="
echo "         All Services Started           "
echo "========================================="
echo ""
echo "Services:"
echo "  - Mobile App:    Expo DevTools (scan QR code)"
echo "  - NGO Dashboard: http://localhost:3002"
echo "  - Backend:       http://localhost:3001 (if available)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down all services...${NC}"
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$DASHBOARD_PID" ] && kill $DASHBOARD_PID 2>/dev/null
    [ -n "$MOBILE_PID" ] && kill $MOBILE_PID 2>/dev/null
    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
