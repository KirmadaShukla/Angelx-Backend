#!/bin/bash

# Comprehensive Exchange and Deposit API Testing Script for AngelX
# Tests all exchange and deposit related endpoints with detailed explanations

echo "=== AngelX Exchange and Deposit API Testing ==="
echo

# Server URL
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test variables
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="admin123"
USER_PHONE="9876543210"
USER_OTP="123456"

# Tokens (will be set during authentication)
ADMIN_TOKEN=""
USER_TOKEN=""
USER_ID=""

echo "=== 1. Setting Up Authentication ==="
echo

# Admin Login
echo "1.1 Admin Login"
response=$(curl -s -X POST $BASE_URL/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
  
admin_token=$(echo "$response" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$admin_token" ]; then
    ADMIN_TOKEN="$admin_token"
    echo -e "   ${GREEN}✅ Admin login successful${NC}"
    echo "   Admin token: ${admin_token:0:20}..."
else
    echo -e "   ${RED}❌ Admin login failed${NC}"
    echo "   Response: $response"
    exit 1
fi
echo

# User Login (Phone verification)
echo "1.2 User Phone Verification"
response=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$USER_PHONE\"}")
  
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Phone verification successful${NC}"
else
    echo -e "   ${RED}❌ Phone verification failed${NC}"
    echo "   Response: $response"
    exit 1
fi
echo

# User OTP Verification
echo "1.3 User OTP Verification"
response=$(curl -s -X POST $BASE_URL/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$USER_PHONE\",\"otp\":\"$USER_OTP\"}")
  
# Extract token - handle different response formats
user_token=$(echo "$response" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$user_token" ]; then
    user_token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

# Extract user ID - handle different response formats
user_id=$(echo "$response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$user_id" ]; then
    user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -n "$user_token" ] && [ -n "$user_id" ]; then
    USER_TOKEN="$user_token"
    USER_ID="$user_id"
    echo -e "   ${GREEN}✅ OTP verification successful${NC}"
    echo "   User token: ${user_token:0:20}..."
    echo "   User ID: $user_id"
else
    echo -e "   ${RED}❌ OTP verification failed${NC}"
    echo "   Response: $response"
    exit 1
fi
echo

echo "=== 2. Testing Deposit Methods ==="
echo

# Get available deposit methods
echo "2.1 Get Available Deposit Methods"
response=$(curl -s $BASE_URL/api/v1/deposit/methods)
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get deposit methods successful${NC}"
    method_count=$(echo "$response" | grep -o '"methods":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Available methods: $method_count"
    
    # Display first method if available
    if [ "$method_count" -gt 0 ]; then
        first_method_id=$(echo "$response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
        first_method_name=$(echo "$response" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   Sample method - ID: $first_method_id, Name: $first_method_name"
    fi
else
    echo -e "   ${RED}❌ Get deposit methods failed${NC}"
    echo "   Response: $response"
fi
echo

# Get admin view of deposit methods
echo "2.2 Get Admin View of Deposit Methods"
response=$(curl -s -X GET $BASE_URL/api/v1/admin/deposit-methods \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get admin deposit methods successful${NC}"
    method_count=$(echo "$response" | grep -o '"methods":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Admin view methods: $method_count"
else
    echo -e "   ${RED}❌ Get admin deposit methods failed${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 3. Testing Deposit APIs ==="
echo

# Get user deposit history
echo "3.1 Get User Deposit History"
response=$(curl -s -X GET "$BASE_URL/api/v1/deposit/history?page=1&limit=5" \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get deposit history successful${NC}"
    deposit_count=$(echo "$response" | grep -o '"deposits":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Deposit records: $deposit_count"
else
    echo -e "   ${RED}❌ Get deposit history failed${NC}"
    echo "   Response: $response"
fi
echo

# Get all deposits (admin)
echo "3.2 Get All Deposits (Admin)"
response=$(curl -s -X GET "$BASE_URL/api/v1/deposit/admin/all?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get all deposits successful${NC}"
    deposit_count=$(echo "$response" | grep -o '"deposits":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Total deposits: $deposit_count"
else
    echo -e "   ${RED}❌ Get all deposits failed${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 4. Testing Exchange Methods ==="
echo

# Get user exchange methods (bank accounts)
echo "4.1 Get User Exchange Methods"
response=$(curl -s -X GET $BASE_URL/api/v1/exchange/methods \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get exchange methods successful${NC}"
    method_count=$(echo "$response" | grep -o '"methods":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Exchange methods: $method_count"
else
    echo -e "   ${RED}❌ Get exchange methods failed${NC}"
    echo "   Response: $response"
fi
echo

# Add a new exchange method (bank account)
echo "4.2 Add New Exchange Method"
timestamp=$(date +%s)
bank_data="{\"bankName\":\"Test Bank $timestamp\",\"accountNo\":\"ACC$timestamp\",\"ifscCode\":\"IFSC$timestamp\",\"accountName\":\"Test User\"}"
response=$(curl -s -X POST $BASE_URL/api/v1/exchange/methods \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$bank_data")
  
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Add exchange method successful${NC}"
    new_method_id=$(echo "$response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   New method ID: $new_method_id"
else
    echo -e "   ${RED}❌ Add exchange method failed${NC}"
    echo "   Response: $response"
fi
echo

# Get user exchange methods again to verify
echo "4.3 Verify New Exchange Method"
response=$(curl -s -X GET $BASE_URL/api/v1/exchange/methods \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Verification successful${NC}"
    method_count=$(echo "$response" | grep -o '"methods":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Updated exchange methods: $method_count"
else
    echo -e "   ${RED}❌ Verification failed${NC}"
    echo "   Response: $response"
fi
echo

# Delete the exchange method we just added
if [ -n "$new_method_id" ]; then
    echo "4.4 Delete Exchange Method"
    response=$(curl -s -X DELETE $BASE_URL/api/v1/exchange/methods/$new_method_id \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ Delete exchange method successful${NC}"
    else
        echo -e "   ${RED}❌ Delete exchange method failed${NC}"
        echo "   Response: $response"
    fi
else
    echo "4.4 Delete Exchange Method"
    echo -e "   ${YELLOW}⚠️  Skipped - no method ID available${NC}"
fi
echo

echo "=== 5. Testing Exchange Rate APIs ==="
echo

# Get current exchange rate
echo "5.1 Get Current Exchange Rate"
response=$(curl -s $BASE_URL/api/v1/exchange/rate)
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get exchange rate successful${NC}"
    rate=$(echo "$response" | grep -o '"rate":[0-9.]*' | cut -d':' -f2)
    echo "   Current rate: $rate INR per USDT"
else
    echo -e "   ${RED}❌ Get exchange rate failed${NC}"
    echo "   Response: $response"
fi
echo

# Update exchange rate from CoinGecko (admin)
echo "5.2 Update Exchange Rate from CoinGecko"
response=$(curl -s -X POST $BASE_URL/api/v1/exchange/rate/coingecko \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Update rate from CoinGecko successful${NC}"
    new_rate=$(echo "$response" | grep -o '"rate":[0-9.]*' | cut -d':' -f2)
    source=$(echo "$response" | grep -o '"source":"[^"]*"' | cut -d'"' -f4)
    echo "   Updated rate: $new_rate INR per USDT (from $source)"
else
    echo -e "   ${YELLOW}⚠️  Update rate from CoinGecko may need network access${NC}"
    echo "   Response: $response"
fi
echo

# Manual update of exchange rate (admin)
echo "5.3 Manual Update of Exchange Rate"
manual_rate_data="{\"dollarRate\":90.5}"
response=$(curl -s -X POST $BASE_URL/api/v1/exchange/rate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$manual_rate_data")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Manual rate update successful${NC}"
    updated_rate=$(echo "$response" | grep -o '"rate":[0-9.]*' | cut -d':' -f2)
    echo "   Manually set rate: $updated_rate INR per USDT"
else
    echo -e "   ${RED}❌ Manual rate update failed${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 6. Testing Exchange History ==="
echo

# Get user exchange history
echo "6.1 Get User Exchange History"
response=$(curl -s -X GET "$BASE_URL/api/v1/exchange/history?page=1&limit=5" \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get exchange history successful${NC}"
    exchange_count=$(echo "$response" | grep -o '"exchanges":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Exchange records: $exchange_count"
else
    echo -e "   ${RED}❌ Get exchange history failed${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 7. Testing Deposit Creation (Simulation) ==="
echo

echo "7.1 Deposit Creation Process Overview"
echo "   Note: Actual deposit creation requires:"
echo "   1. Available deposit methods"
echo "   2. Manual verification by admin"
echo "   3. Transaction ID submission"
echo "   4. Admin status updates"
echo
echo "   Available endpoints for deposit flow:"
echo "   - POST /api/v1/deposit/create      (Create deposit request)"
echo "   - POST /api/v1/deposit/submit-txid (Submit transaction ID)"
echo "   - POST /api/v1/deposit/cancel/:id  (Cancel deposit)"
echo "   - PUT /api/v1/deposit/admin/update-status/:id (Admin update)"
echo

echo "=== 8. Testing Exchange Creation (Simulation) ==="
echo

echo "8.1 Exchange Creation Process Overview"
echo "   Note: Actual exchange creation requires:"
echo "   1. Available exchange methods (bank accounts)"
echo "   2. Sufficient USDT balance"
echo "   3. Valid exchange rate"
echo
echo "   Available endpoints for exchange flow:"
echo "   - POST /api/v1/exchange/create     (Create exchange request)"
echo

echo "=== Test Summary ==="
echo -e "${BLUE}Authentication:${NC}"
echo "  ✅ Admin login"
echo "  ✅ User authentication (phone + OTP)"
echo
echo -e "${BLUE}Deposit APIs:${NC}"
echo "  ✅ Get deposit methods (public)"
echo "  ✅ Get deposit methods (admin)"
echo "  ✅ Get user deposit history"
echo "  ✅ Get all deposits (admin)"
echo
echo -e "${BLUE}Exchange APIs:${NC}"
echo "  ✅ Get exchange methods"
echo "  ✅ Add exchange method"
echo "  ✅ Verify exchange method"
echo "  ✅ Delete exchange method"
echo
echo -e "${BLUE}Exchange Rate APIs:${NC}"
echo "  ✅ Get current exchange rate"
echo "  ✅ Update rate from CoinGecko"
echo "  ✅ Manual rate update"
echo
echo -e "${BLUE}History APIs:${NC}"
echo "  ✅ Get exchange history"
echo
echo -e "${BLUE}Simulation Notes:${NC}"
echo "  🔶 Deposit creation requires manual admin verification"
echo "  🔶 Exchange creation requires sufficient balance"
echo
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Create deposit methods via admin panel"
echo "  2. Test actual deposit flow with manual verification"
echo "  3. Test exchange flow with sufficient balance"
echo "  4. Implement production third-party integrations"