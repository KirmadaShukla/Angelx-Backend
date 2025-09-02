# AngelX Transaction Flow Summary

This document provides a concise overview of the key transaction flows in the AngelX platform.

## 1. Deposit Flow

### Overview
Users can deposit cryptocurrencies to add funds to their account balance.

### Key Steps
1. User views available deposit methods
2. User creates deposit request with amount
3. User sends cryptocurrency to provided address
4. User submits transaction ID (TXID)
5. Admin verifies transaction and approves deposit
6. System credits user balance

### Important Points
- Balance is credited only after admin approval
- Users must submit TXID for verification
- Deposit methods are managed by admins

### API Endpoints
- `GET /api/v1/deposit/methods` - View methods
- `POST /api/v1/deposit/create` - Create request
- `POST /api/v1/deposit/submit-txid` - Submit TXID
- `GET /api/v1/deposit/admin/all` - Admin view (admin only)
- `PUT /api/v1/deposit/admin/update-status/:id` - Approve deposit (admin only)

## 2. Withdrawal Flow

### Overview
Users can withdraw cryptocurrencies from their account to external wallets.

### Key Steps
1. User manages wallet addresses
2. User creates withdrawal request with amount and OTP
3. System immediately deducts amount from user balance
4. Admin processes withdrawal (sends cryptocurrency)
5. Admin updates withdrawal status to approved
6. System creates transaction record

### Important Points
- Balance is deducted immediately when withdrawal is created
- Status changes don't affect balance (already deducted)
- Transaction records are for audit purposes only

### API Endpoints
- `GET /api/v1/wallet/list` - View wallets
- `POST /api/v1/wallet/add` - Add wallet
- `POST /api/v1/withdraw/create` - Create withdrawal
- `GET /api/v1/withdraw/admin/all` - Admin view (admin only)
- `PUT /api/v1/withdraw/admin/update-status/:id` - Approve withdrawal (admin only)

## 3. Exchange Flow

### Overview
Users can exchange cryptocurrencies for fiat currency (INR).

### Key Steps
1. User manages bank accounts
2. User checks current exchange rate
3. User creates exchange request with USDT amount
4. System immediately deducts USDT from user balance
5. Admin processes exchange (transfers INR to bank)
6. Admin updates exchange status to completed

### Important Points
- Exchange rate determines INR equivalent
- USDT balance is deducted immediately upon request
- Fiat transfer is processed manually by admin

### API Endpoints
- `GET /api/v1/exchange/rate` - Check rate
- `GET /api/v1/exchange/methods` - View bank accounts
- `POST /api/v1/exchange/methods` - Add bank account
- `POST /api/v1/exchange/create` - Create exchange
- `GET /api/v1/exchange/history` - View history

## Balance Management Logic

### Key Principles
1. **Deposit**: Balance credited only after admin approval
2. **Withdrawal**: Balance deducted immediately upon request creation
3. **Exchange**: USDT deducted immediately upon request creation
4. **Transaction Records**: Audit trail only, no balance impact

### Status vs Balance
- Changing withdrawal status from pending to approved does NOT affect balance
- Balance was already adjusted when withdrawal request was created
- Transaction records are created for auditing purposes only

## Authentication

### User Roles
1. **Regular Users**: Can deposit, withdraw, exchange
2. **Admins**: Can manage methods, rates, and approve transactions

### Token Types
- **User Token**: For user account operations
- **Admin Token**: For administrative operations

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "errorname": "ErrorType"
}
```

### Validation Errors
```json
{
  "message": "Validation failed: field: Error message",
  "errorname": "ValidationError"
}
```

## Testing

### Available Test Scripts
1. `tests/final_transaction_flow_test.sh` - Complete flow test
2. `tests/api_by_api_test.sh` - Individual endpoint testing
3. `tests/exchange_deposit_test.sh` - Exchange and deposit testing

### Running Tests
```bash
cd tests
./final_transaction_flow_test.sh
```