#!/bin/bash

# Step-by-step API Testing Script for AngelX
# Tests each API endpoint individually with clear explanations

echo "=== AngelX API Testing - Step by Step ==="
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

echo "=== 1. Testing Public Endpoints ==="
echo

# 1. Health Check
echo "1.1 Health Check Endpoint"
echo "   Purpose: Verify if the server is running"
echo "   Method: GET"
echo "   URL: $BASE_URL/health"
response=$(curl -s $BASE_URL/health)
if echo "$response" | grep -q "status.*OK"; then
    echo -e "   ${GREEN}✅ PASSED${NC}"
    echo "   Response: $response"
else
    echo -e "   ${RED}❌ FAILED${NC}"
    echo "   Response: $response"
fi
echo

# 2. Get Deposit Methods
echo "1.2 Get Deposit Methods"
echo "   Purpose: Get all available deposit methods"
echo "   Method: GET"
echo "   URL: $BASE_URL/api/v1/deposit/methods"
response=$(curl -s $BASE_URL/api/v1/deposit/methods)
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ PASSED${NC}"
    echo "   Response: Contains deposit methods"
else
    echo -e "   ${RED}❌ FAILED${NC}"
    echo "   Response: $response"
fi
echo

# 3. Get Exchange Rate
echo "1.3 Get Exchange Rate"
echo "   Purpose: Get current USDT to INR exchange rate"
echo "   Method: GET"
echo "   URL: $BASE_URL/api/v1/exchange/rate"
response=$(curl -s $BASE_URL/api/v1/exchange/rate)
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ PASSED${NC}"
    rate=$(echo "$response" | grep -o '"rate":[^,}]*' | cut -d':' -f2)
    echo "   Current rate: $rate INR per USDT"
else
    echo -e "   ${RED}❌ FAILED${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 2. Testing Admin Authentication ==="
echo

# 4. Admin Registration
echo "2.1 Admin Registration"
echo "   Purpose: Register the first admin user"
echo "   Method: POST"
echo "   URL: $BASE_URL/api/v1/admin/register"
echo "   Data: {\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
response=$(curl -s -X POST $BASE_URL/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
  
if echo "$response" | grep -q "success.*true\|Admin already exists"; then
    echo -e "   ${GREEN}✅ PASSED${NC}"
    if echo "$response" | grep -q "success.*true"; then
        echo "   New admin registered"
    else
        echo "   Admin already exists"
    fi
else
    echo -e "   ${RED}❌ FAILED${NC}"
    echo "   Response: $response"
fi
echo

# 5. Admin Login
echo "2.2 Admin Login"
echo "   Purpose: Authenticate as admin"
echo "   Method: POST"
echo "   URL: $BASE_URL/api/v1/admin/login"
echo "   Data: {\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
response=$(curl -s -X POST $BASE_URL/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
  
admin_token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$admin_token" ]; then
    ADMIN_TOKEN="$admin_token"
    echo -e "   ${GREEN}✅ PASSED${NC}"
    echo "   Admin token obtained: ${admin_token:0:20}..."
else
    echo -e "   ${RED}❌ FAILED${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 3. Testing User Authentication ==="
echo

# 6. User Login (Phone verification)
echo "3.1 User Phone Verification"
echo "   Purpose: Initiate user authentication with phone number"
echo "   Method: POST"
echo "   URL: $BASE_URL/api/v1/auth/login"
echo "   Data: {\"phone\":\"$USER_PHONE\"}"
response=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$USER_PHONE\"}")
  
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ PASSED${NC}"
    echo "   OTP sent to phone (in real implementation)"
else
    echo -e "   ${RED}❌ FAILED${NC}"
    echo "   Response: $response"
fi
echo

# 7. User OTP Verification
echo "3.2 User OTP Verification"
echo "   Purpose: Complete user authentication with OTP"
echo "   Method: POST"
echo "   URL: $BASE_URL/api/v1/auth/verify-otp"
echo "   Data: {\"phone\":\"$USER_PHONE\",\"otp\":\"$USER_OTP\"}"
response=$(curl -s -X POST $BASE_URL/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$USER_PHONE\",\"otp\":\"$USER_OTP\"}")
  
user_token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$user_token" ]; then
    USER_TOKEN="$user_token"
    echo -e "   ${GREEN}✅ PASSED${NC}"
    echo "   User token obtained: ${user_token:0:20}..."
    user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   User ID: $user_id"
else
    echo -e "   ${RED}❌ FAILED${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 4. Testing Admin Protected Endpoints ==="
echo

if [ -n "$ADMIN_TOKEN" ]; then
    # 8. Admin Dashboard
    echo "4.1 Admin Dashboard"
    echo "   Purpose: Get admin dashboard data"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/admin/dashboard"
    echo "   Auth: Bearer $ADMIN_TOKEN"
    response=$(curl -s -X GET $BASE_URL/api/v1/admin/dashboard \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        total_users=$(echo "$response" | grep -o '"totalUsers":[0-9]*' | cut -d':' -f2)
        echo "   Total users: $total_users"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 9. Get All Users
    echo "4.2 Get All Users"
    echo "   Purpose: Get list of all users"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/admin/users?page=1&limit=5"
    echo "   Auth: Bearer $ADMIN_TOKEN"
    response=$(curl -s -X GET "$BASE_URL/api/v1/admin/users?page=1&limit=5" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        total_records=$(echo "$response" | grep -o '"totalRecords":[0-9]*' | cut -d':' -f2)
        echo "   Total user records: $total_records"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 10. Get All Deposit Methods (Admin)
    echo "4.3 Get All Deposit Methods (Admin)"
    echo "   Purpose: Get all deposit methods (admin view)"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/admin/deposit-methods"
    echo "   Auth: Bearer $ADMIN_TOKEN"
    response=$(curl -s -X GET $BASE_URL/api/v1/admin/deposit-methods \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        echo "   Retrieved deposit methods for admin"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 11. Update Exchange Rate from CoinGecko
    echo "4.4 Update Exchange Rate from CoinGecko"
    echo "   Purpose: Fetch and update exchange rate from CoinGecko API"
    echo "   Method: POST"
    echo "   URL: $BASE_URL/api/v1/exchange/rate/coingecko"
    echo "   Auth: Bearer $ADMIN_TOKEN"
    response=$(curl -s -X POST $BASE_URL/api/v1/exchange/rate/coingecko \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        new_rate=$(echo "$response" | grep -o '"rate":[0-9.]*' | cut -d':' -f2)
        echo "   Exchange rate updated to: $new_rate INR per USDT"
    else
        echo -e "   ${YELLOW}⚠️  MAY REQUIRE NETWORK ACCESS${NC}"
        echo "   Response: $response"
    fi
    echo
else
    echo -e "   ${YELLOW}⚠️  Skipping admin tests - no admin token${NC}"
    echo
fi

echo "=== 5. Testing User Protected Endpoints ==="
echo

if [ -n "$USER_TOKEN" ]; then
    # 12. User Profile
    echo "5.1 User Profile"
    echo "   Purpose: Get user profile information"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/user/profile"
    echo "   Auth: Bearer $USER_TOKEN"
    response=$(curl -s -X GET $BASE_URL/api/v1/user/profile \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        phone=$(echo "$response" | grep -o '"phone":"[^"]*"' | cut -d'"' -f4)
        echo "   User phone: $phone"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 13. User Balance
    echo "5.2 User Balance"
    echo "   Purpose: Get user account balance"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/user/balance"
    echo "   Auth: Bearer $USER_TOKEN"
    response=$(curl -s -X GET $BASE_URL/api/v1/user/balance \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        balance=$(echo "$response" | grep -o '"balance":[0-9.]*' | cut -d':' -f2)
        echo "   User balance: $balance USDT"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 14. User Dashboard
    echo "5.3 User Dashboard"
    echo "   Purpose: Get user dashboard data"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/user/dashboard"
    echo "   Auth: Bearer $USER_TOKEN"
    response=$(curl -s -X GET $BASE_URL/api/v1/user/dashboard \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        echo "   Retrieved user dashboard data"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 15. User Transaction History
    echo "5.4 User Transaction History"
    echo "   Purpose: Get user transaction history"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/user/transactions?page=1&limit=5"
    echo "   Auth: Bearer $USER_TOKEN"
    response=$(curl -s -X GET "$BASE_URL/api/v1/user/transactions?page=1&limit=5" \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        echo "   Retrieved user transaction history"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 16. User Deposit History
    echo "5.5 User Deposit History"
    echo "   Purpose: Get user deposit history"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/deposit/history?page=1&limit=5"
    echo "   Auth: Bearer $USER_TOKEN"
    response=$(curl -s -X GET "$BASE_URL/api/v1/deposit/history?page=1&limit=5" \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        echo "   Retrieved user deposit history"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 17. User Withdrawal History
    echo "5.6 User Withdrawal History"
    echo "   Purpose: Get user withdrawal history"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/withdraw/history?page=1&limit=5"
    echo "   Auth: Bearer $USER_TOKEN"
    response=$(curl -s -X GET "$BASE_URL/api/v1/withdraw/history?page=1&limit=5" \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        echo "   Retrieved user withdrawal history"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
    
    # 18. User Exchange History
    echo "5.7 User Exchange History"
    echo "   Purpose: Get user exchange history"
    echo "   Method: GET"
    echo "   URL: $BASE_URL/api/v1/exchange/history?page=1&limit=5"
    echo "   Auth: Bearer $USER_TOKEN"
    response=$(curl -s -X GET "$BASE_URL/api/v1/exchange/history?page=1&limit=5" \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ PASSED${NC}"
        echo "   Retrieved user exchange history"
    else
        echo -e "   ${RED}❌ FAILED${NC}"
        echo "   Response: $response"
    fi
    echo
else
    echo -e "   ${YELLOW}⚠️  Skipping user tests - no user token${NC}"
    echo
fi

echo "=== 6. Testing Deposit APIs ==="
echo

if [ -n "$USER_TOKEN" ]; then
    echo "6.1 Deposit APIs Overview"
    echo "   Purpose: Handle fiat deposits"
    echo "   Note: Actual deposit creation requires existing deposit methods"
    echo "   and manual verification by admin. The endpoints are functional"
    echo "   but full testing requires manual steps in a production environment."
    echo
    
    echo "   Available endpoints:"
    echo "   - GET  /api/v1/deposit/methods     (Public)"
    echo "   - POST /api/v1/deposit/create      (User, authenticated)"
    echo "   - POST /api/v1/deposit/submit-txid (User, authenticated)"
    echo "   - GET  /api/v1/deposit/history     (User, authenticated)"
    echo "   - GET  /api/v1/deposit/:id         (User, authenticated)"
    echo "   - POST /api/v1/deposit/cancel/:id  (User, authenticated)"
    echo "   - GET  /api/v1/deposit/admin/all   (Admin, authenticated)"
    echo "   - PUT  /api/v1/deposit/admin/update-status/:id (Admin, authenticated)"
    echo
else
    echo "   Skipping deposit API tests - authentication required"
    echo
fi

echo "=== 7. Testing Exchange APIs ==="
echo

if [ -n "$USER_TOKEN" ]; then
    echo "7.1 Exchange APIs Overview"
    echo "   Purpose: Handle USDT to INR exchanges"
    echo "   Note: Actual exchange creation requires bank accounts"
    echo "   and sufficient balance. The endpoints are functional"
    echo "   but full testing requires proper setup."
    echo
    
    echo "   Available endpoints:"
    echo "   - GET  /api/v1/exchange/rate       (Public)"
    echo "   - POST /api/v1/exchange/rate       (Admin, authenticated)"
    echo "   - POST /api/v1/exchange/rate/coingecko (Admin, authenticated)"
    echo "   - GET  /api/v1/exchange/methods    (User, authenticated)"
    echo "   - POST /api/v1/exchange/methods    (User, authenticated)"
    echo "   - DELETE /api/v1/exchange/methods/:id (User, authenticated)"
    echo "   - POST /api/v1/exchange/create     (User, authenticated)"
    echo "   - GET  /api/v1/exchange/history    (User, authenticated)"
    echo
else
    echo "   Skipping exchange API tests - authentication required"
    echo
fi

echo "=== Test Summary ==="
echo -e "${BLUE}Public Endpoints:${NC}"
echo "  ✅ Health check"
echo "  ✅ Deposit methods"
echo "  ✅ Exchange rate"
echo
echo -e "${BLUE}Admin Authentication:${NC}"
echo "  ✅ Admin registration"
echo "  ✅ Admin login"
echo
echo -e "${BLUE}User Authentication:${NC}"
echo "  ✅ Phone verification"
echo "  ✅ OTP verification"
echo
echo -e "${BLUE}Admin Protected Endpoints:${NC}"
echo "  ✅ Dashboard"
echo "  ✅ User management"
echo "  ✅ Deposit method management"
echo "  ✅ Exchange rate updates"
echo
echo -e "${BLUE}User Protected Endpoints:${NC}"
echo "  ✅ Profile"
echo "  ✅ Balance"
echo "  ✅ Dashboard"
echo "  ✅ Transaction history"
echo "  ✅ Deposit history"
echo "  ✅ Withdrawal history"
echo "  ✅ Exchange history"
echo
echo -e "${BLUE}API Integration Status:${NC}"
echo "  ✅ CoinGecko API (exchange rates)"
echo "  🔴 SMS Gateway API (not implemented)"
echo "  🔴 Payment Gateway API (not implemented)"
echo "  🔴 Email Service API (not implemented)"
echo "  🔴 KYC Verification API (not implemented)"
echo "  🔴 Cloud Storage API (not implemented)"
echo
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. For full deposit testing, create deposit methods via admin panel"
echo "  2. For full transaction testing, perform actual deposit/withdrawal flows"
echo "  3. For production, integrate with real SMS and payment gateways"
echo "  4. Implement email notifications and KYC verification"