#!/bin/bash

# Quick API Testing Script for AngelX
# Tests the most important endpoints quickly

echo "=== AngelX Quick API Test ==="
echo

# Server URL
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Testing Public Endpoints..."
echo

# 1. Health check
echo "1. Health Check:"
curl -s $BASE_URL/health | grep -q "status.*OK" && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}"

# 2. Deposit methods
echo "2. Deposit Methods:"
curl -s $BASE_URL/api/deposit/methods | grep -q "success.*true" && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}"

# 3. Exchange rate
echo "3. Exchange Rate:"
curl -s $BASE_URL/api/exchange/rate | grep -q "success.*true" && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}"

echo
echo "=== Quick Test Complete ==="
echo "For full authentication and protected endpoint testing,"
echo "run the comprehensive test script after starting the server."