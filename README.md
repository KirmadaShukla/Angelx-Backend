# AngelX Cryptocurrency Exchange API

This is the backend API for the AngelX cryptocurrency exchange platform, built with Node.js, Express, and MongoDB.

## Features

- User authentication with phone number and OTP
- Cryptocurrency exchange functionality (USDT to INR)
- Deposit and withdrawal management
- Admin dashboard for managing users and transactions
- Real-time exchange rates from CoinGecko
- Secure JWT-based authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- 2Factor.in API key for OTP service

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Angelx-NodeJs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
4. Update the `.env` file with your configuration:
   - Set your `OTP_API_KEY` from 2Factor.in
   - Configure your MongoDB connection
   - Set your JWT secret

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API documentation.

## OTP Authentication Flow

AngelX uses phone number and OTP for user authentication with database session storage:

1. User sends their phone number to `/api/v1/auth/login`
2. System sends OTP via 2Factor.in SMS API and stores session ID in database
3. User receives OTP on their phone and sends it to `/api/v1/auth/verify-otp`
4. System retrieves session ID from database and verifies OTP with 2Factor API
5. If OTP is valid, user receives a JWT token for authentication

## Testing

Run the comprehensive API test suite:
```bash
npm run test:flow
```

Run the OTP functionality test:
```bash
npm run test:otp
```

## Seeding Data

To seed initial data (admin user, exchange methods, etc.):
```bash
npm run seed
```

## License

This project is licensed under the ISC License.

# AngelX Cryptocurrency Exchange Platform

AngelX is a comprehensive cryptocurrency exchange platform that allows users to deposit, withdraw, and exchange cryptocurrencies for fiat currency. This documentation provides a detailed overview of the system architecture, API endpoints, and transaction flows.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Authentication](#authentication)
5. [Transaction Flows](#transaction-flows)
   - [Deposit Flow](#deposit-flow)
   - [Withdrawal Flow](#withdrawal-flow)
   - [Exchange Flow](#exchange-flow)
6. [API Endpoints](#api-endpoints)
7. [Database Models](#database-models)
8. [Testing](#testing)
9. [Deployment](#deployment)

## System Overview

AngelX provides a secure platform for users to:
- Deposit fiat currency (INR) to get cryptocurrency (USDT)
- Withdraw cryptocurrency (USDT) to personal wallets
- Exchange cryptocurrency (USDT) for fiat currency (INR)
- Track transaction history and account balances

The system follows a role-based access control model with two user types:
- **Users**: Can deposit, withdraw, and exchange cryptocurrencies
- **Admins**: Can manage deposit methods, exchange rates, and verify transactions

## Technology Stack

- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API design
- **Testing**: Shell scripts and JavaScript tests

## Project Structure

```
Angelx-NodeJs/
├── controllers/          # Business logic handlers
├── middleware/           # Authentication and validation middleware
├── models/               # Database models
├── routes/               # API route definitions
├── tests/                # API testing scripts
├── utils/                # Utility functions
├── app.js               # Application entry point
├── seed.js              # Database seeding script
└── package.json         # Project dependencies
```

## Authentication

AngelX uses JWT for authentication. There are two types of tokens:

1. **User Token**: For regular users to access their accounts
2. **Admin Token**: For administrators to manage the platform

### Authentication Flow

1. **User Login**:
   - User sends phone number to `/api/v1/auth/login`
   - System sends OTP (in production) or simulates it in development
   - User verifies OTP at `/api/v1/auth/verify-otp`
   - System returns JWT token

2. **Admin Login**:
   - Admin sends credentials to `/api/v1/admin/login`
   - System validates and returns admin JWT token

All protected endpoints require the appropriate token in the `Authorization: Bearer <token>` header.

## Transaction Flows

### Deposit Flow

The deposit flow allows users to add cryptocurrency to their account balance by depositing fiat currency.

#### Process Steps:

1. **View Deposit Methods**:
   - User fetches available deposit methods from `/api/v1/deposit/methods`
   - System returns list of supported payment methods and their addresses

2. **Create Deposit Request**:
   - User selects a method and specifies INR amount to deposit
   - User sends request to `/api/v1/deposit/create`
   - System creates pending deposit record and returns payment details

3. **Submit Transaction ID**:
   - User makes payment using the provided method
   - User submits transaction ID to `/api/v1/deposit/submit-txid`
   - System updates deposit status to "awaiting_txid"

4. **Admin Verification**:
   - Admin checks pending deposits at `/api/v1/deposit/admin/all`
   - Admin verifies transaction (e.g., checks bank transfer)
   - Admin updates deposit status to "completed" at `/api/v1/deposit/admin/update-status/:id`
   - System converts INR to USDT using current exchange rate and credits user balance

#### Key Points:
- Users deposit fiat currency (INR) and receive cryptocurrency (USDT)
- Balance is credited only after admin approval with proper conversion
- Transaction IDs are required for verification
- Deposit methods are managed by admins

### Withdrawal Flow

The withdrawal flow allows users to transfer cryptocurrency from their account to external wallets.

#### Process Steps:

1. **Manage Wallets**:
   - User adds wallet addresses at `/api/v1/wallet/add`
   - User can view saved wallets at `/api/v1/wallet/list`

2. **Create Withdrawal Request**:
   - User selects wallet and USDT amount
   - User sends request to `/api/v1/withdraw/create` with OTP verification
   - System immediately deducts USDT amount from user balance
   - System creates pending withdrawal record

3. **Admin Processing**:
   - Admin views pending withdrawals at `/api/v1/withdraw/admin/all`
   - Admin processes withdrawal (sends cryptocurrency to user's wallet)
   - Admin updates withdrawal status to "approved" at `/api/v1/withdraw/admin/update-status/:id`
   - System creates transaction record for audit

#### Key Points:
- Balance is deducted immediately when withdrawal is created
- Status changes don't affect balance (balance already deducted)
- Transaction records are for audit purposes only

### Exchange Flow

The exchange flow allows users to convert cryptocurrency to fiat currency.

#### Process Steps:

1. **Manage Bank Accounts**:
   - User adds bank account details at `/api/v1/exchange/methods`
   - User can view saved accounts at `/api/v1/exchange/methods`

2. **Check Exchange Rate**:
   - User fetches current rate from `/api/v1/exchange/rate`
   - Admin can update rates manually or via CoinGecko API

3. **Create Exchange Request**:
   - User selects bank account and USDT amount
   - User sends request to `/api/v1/exchange/create`
   - System immediately deducts USDT from user balance
   - System creates pending exchange record with INR equivalent

4. **Admin Processing**:
   - Admin processes exchange (transfers INR to user's bank account)
   - Admin updates exchange status to "completed" at `/api/v1/exchange/admin/update-status/:id`
   - User receives fiat currency in their bank account

#### Key Points:
- Exchange rate is used to calculate INR equivalent
- USDT balance is deducted immediately upon request
- Fiat transfer is processed manually by admin

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/login` | Send phone number for OTP | Public |
| POST | `/api/v1/auth/verify-otp` | Verify OTP and get token | Public |
| POST | `/api/v1/admin/login` | Admin login with credentials | Public |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/user/profile` | Get user profile | User |
| GET | `/api/v1/user/balance` | Get user balance | User |
| GET | `/api/v1/user/dashboard` | Get dashboard data | User |
| GET | `/api/v1/user/transactions` | Get transaction history | User |

### Wallet Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/wallet/list` | Get user wallets | User |
| POST | `/api/v1/wallet/add` | Add new wallet | User |
| PUT | `/api/v1/wallet/:id` | Update wallet | User |
| DELETE | `/api/v1/wallet/:id` | Delete wallet | User |

### Deposit Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/deposit/methods` | Get deposit methods | Public |
| POST | `/api/v1/deposit/create` | Create deposit request | User |
| POST | `/api/v1/deposit/submit-txid` | Submit transaction ID | User |
| GET | `/api/v1/deposit/history` | Get user deposit history | User |
| GET | `/api/v1/deposit/admin/all` | Get all deposits (admin) | Admin |
| PUT | `/api/v1/deposit/admin/update-status/:id` | Update deposit status | Admin |

### Withdrawal Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/withdraw/create` | Create withdrawal request | User |
| GET | `/api/v1/withdraw/history` | Get user withdrawal history | User |
| POST | `/api/v1/withdraw/cancel/:id` | Cancel pending withdrawal | User |
| GET | `/api/v1/withdraw/admin/all` | Get all withdrawals (admin) | Admin |
| PUT | `/api/v1/withdraw/admin/update-status/:id` | Update withdrawal status | Admin |

### Exchange Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/exchange/rate` | Get current exchange rate | Public |
| POST | `/api/v1/exchange/rate` | Update exchange rate | Admin |
| POST | `/api/v1/exchange/rate/coingecko` | Update rate from CoinGecko | Admin |
| GET | `/api/v1/exchange/methods` | Get user bank accounts | User |
| POST | `/api/v1/exchange/methods` | Add bank account | User |
| DELETE | `/api/v1/exchange/methods/:id` | Delete bank account | User |
| POST | `/api/v1/exchange/create` | Create exchange request | User |
| GET | `/api/v1/exchange/history` | Get exchange history | User |
| GET | `/api/v1/exchange/admin/all` | Get all exchanges (admin) | Admin |
| PUT | `/api/v1/exchange/admin/update-status/:id` | Update exchange status | Admin |

## Database Models

### User
- `phone`: String (unique)
- `balance`: Number (default: 0) - USDT balance

### Wallet
- `userId`: ObjectId (ref: User)
- `method`: String (enum: USDT, PAYX)
- `walletAddress`: String
- `network`: String

### DepositMethod
- `name`: String
- `networkCode`: String
- `address`: String
- `isActive`: Boolean

### Deposit
- `userId`: ObjectId (ref: User)
- `methodId`: ObjectId (ref: DepositMethod)
- `amount`: Number - INR amount deposited
- `txid`: String
- `status`: String (enum: pending, awaiting_txid, processing, completed, failed, expired)

### Withdrawal
- `userId`: ObjectId (ref: User)
- `method`: String (enum: USDT, PAYX)
- `walletAddress`: String
- `amount`: Number - USDT amount withdrawn
- `network`: String
- `status`: String (enum: pending, approved, rejected)

### ExchangeMethod (Bank Account)
- `userId`: ObjectId (ref: User)
- `bankName`: String
- `accountNo`: String
- `ifscCode`: String
- `accountName`: String

### Exchange
- `userId`: ObjectId (ref: User)
- `methodId`: ObjectId (ref: ExchangeMethod)
- `amount`: Number (INR) - INR equivalent
- `usdtAmount`: Number - USDT amount exchanged
- `fee`: Number
- `status`: String (enum: pending, completed, failed)

### ExchangeRate
- `dollarRate`: Number - INR per USDT exchange rate
- `updatedBy`: String

### Transaction
- `userId`: ObjectId (ref: User)
- `type`: String (enum: deposit, withdrawal)
- `amount`: Number - USDT amount
- `status`: String (enum: completed, processing)

### OtpSession
- `phone`: String - User's phone number
- `sessionId`: String - Session ID from OTP service
- `otp`: String - Generated OTP (optional)
- `createdAt`: Date - Session creation time with 5-minute expiration

## Testing

The platform includes comprehensive test scripts to verify functionality:

1. **Transaction Flow Tests**: `tests/final_transaction_flow_test.sh`
2. **API Endpoint Tests**: `tests/api_by_api_test.sh`
3. **Exchange Tests**: `tests/exchange_deposit_test.sh`
4. **OTP Database Tests**: `npm run test:otp-db`
5. **OTP Flow Tests**: `npm run test:otp-flow`

To run tests:
```bash
# For shell script tests
cd tests
./final_transaction_flow_test.sh

# For OTP database tests
npm run test:otp-db

# For OTP flow tests
npm run test:otp-flow
```

## Deployment

### Prerequisites
- Node.js v14+
- MongoDB
- npm or yarn

### Installation
```bash
git clone <repository-url>
cd Angelx-NodeJs
npm install
```

### Configuration
Create a `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/angelx
JWT_SECRET=your-secret-key
COOKIE_EXPIRE=30
```

### Seeding Database
```bash
node seed.js
```

### Running the Application
```bash
npm start
```

The server will start on port 3000 by default.

## Postman Collections

Import the following Postman collections for API testing:
- `AngelX-API.postman_collection.json`
- `AngelX-Cryptocurrency-Exchange-API.postman_collection.json`