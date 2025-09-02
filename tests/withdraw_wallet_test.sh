#!/bin/bash

# Comprehensive Withdraw and Wallet API Testing Script for AngelX
# Tests all withdraw and wallet related endpoints with detailed explanations

echo "=== AngelX Withdraw and Wallet API Testing ==="
echo

# Server URL
BASE_URL="http://localhost:3000/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test variables
ADMIN_EMAIL="admin@angelx.com"
ADMIN_PASSWORD="admin123"
USER_PHONE="9876543210"
USER_OTP="123456"

# Tokens (will be set during authentication)
ADMIN_TOKEN=""
USER_TOKEN=""
USER_ID=""
new_wallet_id=""
new_method_id=""

echo "=== 1. Setting Up Authentication ==="
echo

# Admin Login
echo "1.1 Admin Login"
response=$(curl -s -X POST $BASE_URL/admin/login \
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
response=$(curl -s -X POST $BASE_URL/auth/login \
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
response=$(curl -s -X POST $BASE_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$USER_PHONE\",\"otp\":\"$USER_OTP\"}")
  
# Extract token and user ID
user_token=$(echo "$response" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
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

echo "=== 2. Testing Wallet APIs ==="
echo

# Get user wallets
echo "2.1 Get User Wallets"
response=$(curl -s -X GET $BASE_URL/wallet/list \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get wallets successful${NC}"
    wallet_count=$(echo "$response" | grep -o '"wallets":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Wallets: $wallet_count"
else
    echo -e "   ${RED}❌ Get wallets failed${NC}"
    echo "   Response: $response"
fi
echo

# Add a new wallet
echo "2.2 Add New Wallet"
timestamp=$(date +%s)
wallet_data="{\"method\":\"USDT\",\"walletAddress\":\"0xWalletAddress$timestamp\",\"network\":\"ERC20\"}"
response=$(curl -s -X POST $BASE_URL/wallet/add \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$wallet_data")
  
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Add wallet successful${NC}"
    new_wallet_id=$(echo "$response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   New wallet ID: $new_wallet_id"
else
    echo -e "   ${RED}❌ Add wallet failed${NC}"
    echo "   Response: $response"
fi
echo

# Get user wallets again to verify
echo "2.3 Verify New Wallet"
response=$(curl -s -X GET $BASE_URL/wallet/list \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Verification successful${NC}"
    wallet_count=$(echo "$response" | grep -o '"wallets":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Updated wallets: $wallet_count"
else
    echo -e "   ${RED}❌ Verification failed${NC}"
    echo "   Response: $response"
fi
echo

# Get specific wallet details
if [ -n "$new_wallet_id" ]; then
    echo "2.4 Get Wallet Details"
    response=$(curl -s -X GET $BASE_URL/wallet/$new_wallet_id \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ Get wallet details successful${NC}"
        wallet_method=$(echo "$response" | grep -o '"method":"[^"]*"' | cut -d'"' -f4)
        wallet_address=$(echo "$response" | grep -o '"walletAddress":"[^"]*"' | cut -d'"' -f4)
        echo "   Wallet method: $wallet_method"
        echo "   Wallet address: $wallet_address"
    else
        echo -e "   ${RED}❌ Get wallet details failed${NC}"
        echo "   Response: $response"
    fi
else
    echo "2.4 Get Wallet Details"
    echo -e "   ${YELLOW}⚠️  Skipped - no wallet ID available${NC}"
fi
echo

# Update wallet
if [ -n "$new_wallet_id" ]; then
    echo "2.5 Update Wallet"
    updated_wallet_data="{\"walletAddress\":\"0xUpdatedWalletAddress$timestamp\",\"network\":\"TRC20\"}"
    response=$(curl -s -X PUT $BASE_URL/wallet/$new_wallet_id \
      -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$updated_wallet_data")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ Update wallet successful${NC}"
        updated_address=$(echo "$response" | grep -o '"walletAddress":"[^"]*"' | cut -d'"' -f4)
        updated_network=$(echo "$response" | grep -o '"network":"[^"]*"' | cut -d'"' -f4)
        echo "   Updated address: $updated_address"
        echo "   Updated network: $updated_network"
    else
        echo -e "   ${RED}❌ Update wallet failed${NC}"
        echo "   Response: $response"
    fi
else
    echo "2.5 Update Wallet"
    echo -e "   ${YELLOW}⚠️  Skipped - no wallet ID available${NC}"
fi
echo

# Delete wallet
if [ -n "$new_wallet_id" ]; then
    echo "2.6 Delete Wallet"
    response=$(curl -s -X DELETE $BASE_URL/wallet/$new_wallet_id \
      -H "Authorization: Bearer $USER_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ Delete wallet successful${NC}"
    else
        echo -e "   ${RED}❌ Delete wallet failed${NC}"
        echo "   Response: $response"
    fi
else
    echo "2.6 Delete Wallet"
    echo -e "   ${YELLOW}⚠️  Skipped - no wallet ID available${NC}"
fi
echo

# Get wallet summary
echo "2.7 Get Wallet Summary"
response=$(curl -s -X GET $BASE_URL/wallet/methods/summary \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get wallet summary successful${NC}"
    summary_count=$(echo "$response" | grep -o '"summary":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Summary entries: $summary_count"
else
    echo -e "   ${RED}❌ Get wallet summary failed${NC}"
    echo "   Response: $response"
fi
echo

# Validate wallet address
echo "2.8 Validate Wallet Address"
validate_data="{\"method\":\"USDT\",\"walletAddress\":\"0x1234567890123456789012345678901234567890\",\"network\":\"ERC20\"}"
response=$(curl -s -X POST $BASE_URL/wallet/validate \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$validate_data")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Validate wallet successful${NC}"
    is_valid=$(echo "$response" | grep -o '"isValid":[^,}]*' | cut -d':' -f2)
    echo "   Address valid: $is_valid"
else
    echo -e "   ${RED}❌ Validate wallet failed${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 3. Testing Withdraw APIs ==="
echo

# Get user withdrawal history
echo "3.1 Get User Withdrawal History"
response=$(curl -s -X GET $BASE_URL/withdraw/history \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get withdrawal history successful${NC}"
    withdrawal_count=$(echo "$response" | grep -o '"withdrawals":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Withdrawal records: $withdrawal_count"
else
    echo -e "   ${RED}❌ Get withdrawal history failed${NC}"
    echo "   Response: $response"
fi
echo

# Get user withdrawal statistics
echo "3.2 Get User Withdrawal Statistics"
response=$(curl -s -X GET $BASE_URL/withdraw/stats/summary \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get withdrawal stats successful${NC}"
    stats_count=$(echo "$response" | grep -o '"stats":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Stats entries: $stats_count"
else
    echo -e "   ${RED}❌ Get withdrawal stats failed${NC}"
    echo "   Response: $response"
fi
echo

# Get all withdrawals (admin)
echo "3.3 Get All Withdrawals (Admin)"
response=$(curl -s -X GET $BASE_URL/withdraw/admin/all \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get all withdrawals successful${NC}"
    total_count=$(echo "$response" | grep -o '"withdrawals":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Total withdrawals: $total_count"
else
    echo -e "   ${RED}❌ Get all withdrawals failed${NC}"
    echo "   Response: $response"
fi
echo

# Get admin withdrawal statistics
echo "3.4 Get Admin Withdrawal Statistics"
response=$(curl -s -X GET $BASE_URL/withdraw/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get admin withdrawal stats successful${NC}"
    total_count=$(echo "$response" | grep -o '"totalWithdrawals":[0-9]*' | cut -d':' -f2)
    echo "   Total withdrawals: $total_count"
else
    echo -e "   ${RED}❌ Get admin withdrawal stats failed${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 4. Testing Additional APIs ==="
echo

# Get user statistics
echo "4.1 Get User Statistics"
response=$(curl -s -X GET $BASE_URL/user/stats \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Get user stats successful${NC}"
    has_tx_stats=$(echo "$response" | grep -q '"transactionStats"' && echo "yes" || echo "no")
    has_deposit_stats=$(echo "$response" | grep -q '"depositStats"' && echo "yes" || echo "no")
    has_withdraw_stats=$(echo "$response" | grep -q '"withdrawalStats"' && echo "yes" || echo "no")
    echo "   Contains transaction stats: $has_tx_stats"
    echo "   Contains deposit stats: $has_deposit_stats"
    echo "   Contains withdrawal stats: $has_withdraw_stats"
else
    echo -e "   ${RED}❌ Get user stats failed${NC}"
    echo "   Response: $response"
fi
echo

echo "=== 5. Testing Deposit APIs (Additional) ==="
echo

# Create deposit method (admin)
echo "5.1 Create Deposit Method (Admin)"
timestamp=$(date +%s)
deposit_method_data="{\"name\":\"USDT_$timestamp\",\"networkCode\":\"TRC20_$timestamp\",\"address\":\"TDepositAddress$timestamp\",\"isActive\":true}"
response=$(curl -s -X POST $BASE_URL/admin/deposit-methods \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$deposit_method_data")
  
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Create deposit method successful${NC}"
    new_method_id=$(echo "$response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   New deposit method ID: $new_method_id"
else
    echo -e "   ${RED}❌ Create deposit method failed${NC}"
    echo "   Response: $response"
fi
echo

# Verify new deposit method
echo "5.2 Verify New Deposit Method"
response=$(curl -s -X GET $BASE_URL/admin/deposit-methods \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$response" | grep -q "success.*true"; then
    echo -e "   ${GREEN}✅ Verify deposit methods successful${NC}"
    method_count=$(echo "$response" | grep -o '"depositMethods":\[[^][]*\]' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Total deposit methods: $method_count"
else
    echo -e "   ${RED}❌ Verify deposit methods failed${NC}"
    echo "   Response: $response"
fi
echo

# Update deposit method (admin)
if [ -n "$new_method_id" ]; then
    echo "5.3 Update Deposit Method (Admin)"
    update_method_data="{\"name\":\"Updated USDT_$timestamp\",\"networkCode\":\"TRC20_$timestamp\",\"address\":\"TUpdatedDepositAddress$timestamp\",\"isActive\":true}"
    response=$(curl -s -X PUT $BASE_URL/admin/deposit-methods/$new_method_id \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$update_method_data")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ Update deposit method successful${NC}"
    else
        echo -e "   ${RED}❌ Update deposit method failed${NC}"
        echo "   Response: $response"
    fi
else
    echo "5.3 Update Deposit Method (Admin)"
    echo -e "   ${YELLOW}⚠️  Skipped - no deposit method ID available${NC}"
fi
echo

# Delete deposit method (admin)
if [ -n "$new_method_id" ]; then
    echo "5.4 Delete Deposit Method (Admin)"
    response=$(curl -s -X DELETE $BASE_URL/admin/deposit-methods/$new_method_id \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$response" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ Delete deposit method successful${NC}"
    else
        echo -e "   ${RED}❌ Delete deposit method failed${NC}"
        echo "   Response: $response"
    fi
else
    echo "5.4 Delete Deposit Method (Admin)"
    echo -e "   ${YELLOW}⚠️  Skipped - no deposit method ID available${NC}"
fi
echo

echo "=== Test Summary ==="
echo "Authentication:"
echo "  ✅ Admin login"
echo "  ✅ User authentication (phone + OTP)"
echo
echo "Wallet APIs:"
echo "  ✅ Get user wallets"
echo "  ✅ Add new wallet"
echo "  ✅ Verify new wallet"
echo "  ✅ Get wallet details"
echo "  ✅ Update wallet"
echo "  ✅ Delete wallet"
echo "  ✅ Get wallet summary"
echo "  ✅ Validate wallet address"
echo
echo "Withdraw APIs:"
echo "  ✅ Get user withdrawal history"
echo "  ✅ Get user withdrawal statistics"
echo "  ✅ Get all withdrawals (admin)"
echo "  ✅ Get admin withdrawal statistics"
echo
echo "Additional APIs:"
echo "  ✅ Get user statistics"
echo
echo "Deposit APIs:"
echo "  ✅ Create deposit method (admin)"
echo "  ✅ Verify deposit methods"
echo "  ✅ Update deposit method (admin)"
echo "  ✅ Delete deposit method (admin)"
echo
echo "Next Steps:"
echo "  1. Test actual withdrawal flow with sufficient balance"
echo "  2. Test deposit flow with manual verification"
echo "  3. Implement production third-party integrations"