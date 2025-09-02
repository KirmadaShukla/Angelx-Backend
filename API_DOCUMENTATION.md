# AngelX API Documentation

This document provides detailed information about all API endpoints available in the AngelX cryptocurrency exchange platform.

## Authentication

### User Authentication

#### Send Phone Number for OTP
- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Access**: Public
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "phone": "9876543210"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "OTP verification initiated",
    "data": {
      "phone": "9876543210",
      "maskedPhone": "987*****10",
      "otp": "123456"
    }
  }
  ```

#### Verify OTP
- **URL**: `/api/v1/auth/verify-otp`
- **Method**: `POST`
- **Access**: Public
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "phone": "9876543210",
    "otp": "123456"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "user": {
        "_id": "68b70f2eea8139b9bea719b2",
        "phone": "9876543210",
        "balance": 0,
        "createdAt": "2025-09-02T15:37:18.515Z",
        "updatedAt": "2025-09-02T15:37:18.515Z"
      }
    }
  }
  ```

### Admin Authentication

#### Admin Login
- **URL**: `/api/v1/admin/login`
- **Method**: `POST`
- **Access**: Public
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "admin@angelx.com",
    "password": "admin123"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "user": {
        "_id": "68b7168b027519cd4f3ffabf",
        "email": "admin@angelx.com",
        "createdAt": "2025-09-02T16:08:43.317Z",
        "updatedAt": "2025-09-02T16:08:43.317Z"
      }
    }
  }
  ```

## User Management

### Get User Profile
- **URL**: `/api/v1/user/profile`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "68b70f2eea8139b9bea719b2",
        "phone": "9876543210",
        "maskedPhone": "987*****10",
        "balance": 500,
        "createdAt": "2025-09-02T15:37:18.515Z",
        "updatedAt": "2025-09-02T17:40:25.979Z"
      }
    }
  }
  ```

### Get User Balance
- **URL**: `/api/v1/user/balance`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "balance": 500
    }
  }
  ```

### Get User Dashboard
- **URL**: `/api/v1/user/dashboard`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "68b70f2eea8139b9bea719b2",
        "phone": "9876543210",
        "maskedPhone": "987*****10",
        "balance": 500,
        "createdAt": "2025-09-02T15:37:18.515Z"
      },
      "statistics": {
        "pendingDeposits": 0,
        "pendingWithdrawals": 0,
        "totalTransactions": 2
      },
      "recentTransactions": [
        {
          "_id": "68b7338f376045ba9a16c464",
          "userId": "68b732d8376045ba9a16c434",
          "type": "withdrawal",
          "amount": 500,
          "status": "completed",
          "createdAt": "2025-09-02T18:12:31.976Z"
        }
      ]
    }
  }
  ```

### Get User Transactions
- **URL**: `/api/v1/user/transactions`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `type`: Transaction type (deposit, withdrawal)
  - `status`: Transaction status (completed, processing)
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "transactions": [
        {
          "_id": "68b7338f376045ba9a16c464",
          "userId": "68b732d8376045ba9a16c434",
          "type": "withdrawal",
          "amount": 500,
          "status": "completed",
          "createdAt": "2025-09-02T18:12:31.976Z",
          "updatedAt": "2025-09-02T18:12:31.976Z"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalRecords": 2,
        "hasNext": false,
        "hasPrev": false
      }
    }
  }
  ```

## Wallet Management

### Get User Wallets
- **URL**: `/api/v1/wallet/list`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "wallets": [
        {
          "_id": "68b732e2376045ba9a16c438",
          "userId": "68b732d8376045ba9a16c434",
          "method": "USDT",
          "walletAddress": "0xNewUserWalletAddress123456789",
          "network": "TRC20",
          "createdAt": "2025-09-02T18:09:38.424Z",
          "updatedAt": "2025-09-02T18:09:38.424Z"
        }
      ]
    }
  }
  ```

### Add Wallet
- **URL**: `/api/v1/wallet/add`
- **Method**: `POST`
- **Access**: User
- **Headers**: 
  - `Authorization: Bearer <user_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "method": "USDT",
    "walletAddress": "0xNewUserWalletAddress123456789",
    "network": "TRC20"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Wallet address added successfully",
    "data": {
      "wallet": {
        "_id": "68b732e2376045ba9a16c438",
        "userId": "68b732d8376045ba9a16c434",
        "method": "USDT",
        "walletAddress": "0xNewUserWalletAddress123456789",
        "network": "TRC20",
        "createdAt": "2025-09-02T18:09:38.424Z",
        "updatedAt": "2025-09-02T18:09:38.424Z"
      }
    }
  }
  ```

## Deposit Management

### Get Deposit Methods
- **URL**: `/api/v1/deposit/methods`
- **Method**: `GET`
- **Access**: Public
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "methods": [
        {
          "_id": "68b73251111d749a7cd57bb8",
          "name": "USDT",
          "networkCode": "TRC20",
          "address": "TQRcfuqvkJT6YtnHjFxzYrLhRuWyiphqTs",
          "qrPath": null,
          "isActive": true,
          "createdAt": "2025-09-02T18:07:13.906Z",
          "updatedAt": "2025-09-02T18:07:13.906Z"
        }
      ]
    }
  }
  ```

### Create Deposit Request
- **URL**: `/api/v1/deposit/create`
- **Method**: `POST`
- **Access**: User
- **Headers**: 
  - `Authorization: Bearer <user_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "methodId": "68b73251111d749a7cd57bb8",
    "amount": 1000
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Deposit request created successfully",
    "data": {
      "deposit": {
        "id": "68b732fa376045ba9a16c43d",
        "amount": 1000,
        "status": "pending",
        "expiresAt": "2025-09-02T18:40:02.660Z",
        "method": {
          "_id": "68b73251111d749a7cd57bb8",
          "name": "USDT",
          "networkCode": "TRC20",
          "address": "TQRcfuqvkJT6YtnHjFxzYrLhRuWyiphqTs"
        },
        "createdAt": "2025-09-02T18:10:02.662Z"
      }
    }
  }
  ```

### Submit Transaction ID
- **URL**: `/api/v1/deposit/submit-txid`
- **Method**: `POST`
- **Access**: User
- **Headers**: 
  - `Authorization: Bearer <user_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "depositId": "68b732fa376045ba9a16c43d",
    "txid": "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Transaction ID submitted successfully. Deposit is being processed.",
    "data": {
      "depositId": "68b732fa376045ba9a16c43d",
      "txid": "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
      "status": "awaiting_txid"
    }
  }
  ```

### Get User Deposit History
- **URL**: `/api/v1/deposit/history`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "deposits": [
        {
          "_id": "68b732fa376045ba9a16c43d",
          "userId": "68b732d8376045ba9a16c434",
          "methodId": {
            "_id": "68b73251111d749a7cd57bb8",
            "name": "USDT"
          },
          "amount": 1000,
          "txid": "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
          "status": "completed",
          "expiresAt": "2025-09-02T18:40:02.660Z",
          "createdAt": "2025-09-02T18:10:02.662Z",
          "updatedAt": "2025-09-02T18:10:46.428Z"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalRecords": 1
      }
    }
  }
  ```

### Get All Deposits (Admin)
- **URL**: `/api/v1/deposit/admin/all`
- **Method**: `GET`
- **Access**: Admin
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `status`: Filter by status
  - `userId`: Filter by user ID
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "deposits": [
        {
          "_id": "68b732fa376045ba9a16c43d",
          "userId": {
            "_id": "68b732d8376045ba9a16c434",
            "phone": "1234567890"
          },
          "methodId": {
            "_id": "68b73251111d749a7cd57bb8",
            "name": "USDT",
            "networkCode": "TRC20"
          },
          "amount": 1000,
          "txid": "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
          "status": "completed",
          "expiresAt": "2025-09-02T18:40:02.660Z",
          "createdAt": "2025-09-02T18:10:02.662Z",
          "updatedAt": "2025-09-02T18:10:46.428Z"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalRecords": 1
      }
    }
  }
  ```

### Update Deposit Status (Admin)
- **URL**: `/api/v1/deposit/admin/update-status/:id`
- **Method**: `PUT`
- **Access**: Admin
- **Headers**: 
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`
- **URL Parameters**:
  - `id`: Deposit ID
- **Body**:
  ```json
  {
    "status": "completed"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Deposit status updated successfully",
    "data": {
      "deposit": {
        "_id": "68b732fa376045ba9a16c43d",
        "userId": {
          "_id": "68b732d8376045ba9a16c434",
          "phone": "1234567890",
          "balance": 1000
        },
        "methodId": "68b73251111d749a7cd57bb8",
        "amount": 1000,
        "txid": "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
        "status": "completed",
        "expiresAt": "2025-09-02T18:40:02.660Z",
        "createdAt": "2025-09-02T18:10:02.662Z",
        "updatedAt": "2025-09-02T18:10:46.428Z"
      },
      "oldStatus": "awaiting_txid",
      "newStatus": "completed"
    }
  }
  ```

## Withdrawal Management

### Create Withdrawal Request
- **URL**: `/api/v1/withdraw/create`
- **Method**: `POST`
- **Access**: User
- **Headers**: 
  - `Authorization: Bearer <user_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "walletId": "68b732e2376045ba9a16c438",
    "amount": 500,
    "otp": "123456"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Withdrawal request created successfully",
    "data": {
      "withdrawal": {
        "id": "68b7336c376045ba9a16c458",
        "amount": 500,
        "status": "pending",
        "wallet": {
          "method": "USDT",
          "walletAddress": "0xNewUserWalletAddress123456789"
        },
        "createdAt": "2025-09-02T18:11:56.736Z"
      }
    }
  }
  ```

### Get User Withdrawal History
- **URL**: `/api/v1/withdraw/history`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "withdrawals": [
        {
          "_id": "68b7336c376045ba9a16c458",
          "userId": "68b732d8376045ba9a16c434",
          "method": "USDT",
          "walletAddress": "0xNewUserWalletAddress123456789",
          "amount": 500,
          "network": "TRC20",
          "status": "approved",
          "createdAt": "2025-09-02T18:11:56.736Z",
          "updatedAt": "2025-09-02T18:12:31.978Z"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalRecords": 1
      }
    }
  }
  ```

### Cancel Withdrawal
- **URL**: `/api/v1/withdraw/cancel/:id`
- **Method**: `POST`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **URL Parameters**:
  - `id`: Withdrawal ID
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Withdrawal request cancelled successfully",
    "data": {
      "withdrawalId": "68b7336c376045ba9a16c458",
      "status": "cancelled"
    }
  }
  ```

### Get All Withdrawals (Admin)
- **URL**: `/api/v1/withdraw/admin/all`
- **Method**: `GET`
- **Access**: Admin
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `status`: Filter by status
  - `userId`: Filter by user ID
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "withdrawals": [
        {
          "_id": "68b7336c376045ba9a16c458",
          "userId": {
            "_id": "68b732d8376045ba9a16c434",
            "phone": "1234567890"
          },
          "method": "USDT",
          "walletAddress": "0xNewUserWalletAddress123456789",
          "amount": 500,
          "network": "TRC20",
          "status": "approved",
          "createdAt": "2025-09-02T18:11:56.736Z",
          "updatedAt": "2025-09-02T18:12:31.978Z"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalRecords": 1
      }
    }
  }
  ```

### Update Withdrawal Status (Admin)
- **URL**: `/api/v1/withdraw/admin/update-status/:id`
- **Method**: `PUT`
- **Access**: Admin
- **Headers**: 
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`
- **URL Parameters**:
  - `id`: Withdrawal ID
- **Body**:
  ```json
  {
    "status": "approved"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Withdrawal status updated successfully",
    "data": {
      "withdrawal": {
        "_id": "68b7336c376045ba9a16c458",
        "userId": {
          "_id": "68b732d8376045ba9a16c434",
          "phone": "1234567890",
          "balance": 500
        },
        "method": "USDT",
        "walletAddress": "0xNewUserWalletAddress123456789",
        "amount": 500,
        "network": "TRC20",
        "status": "approved",
        "createdAt": "2025-09-02T18:11:56.736Z",
        "updatedAt": "2025-09-02T18:12:31.978Z"
      },
      "oldStatus": "pending",
      "newStatus": "approved"
    }
  }
  ```

## Exchange Management

### Get Current Exchange Rate
- **URL**: `/api/v1/exchange/rate`
- **Method**: `GET`
- **Access**: Public
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "rate": 83.5,
      "lastUpdated": "2025-09-02T16:08:43.457Z"
    }
  }
  ```

### Update Exchange Rate (Admin)
- **URL**: `/api/v1/exchange/rate`
- **Method**: `POST`
- **Access**: Admin
- **Headers**: 
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "dollarRate": 85.0
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Exchange rate updated successfully",
    "data": {
      "rate": 85.0,
      "lastUpdated": "2025-09-02T18:15:00.000Z"
    }
  }
  ```

### Update Rate from CoinGecko (Admin)
- **URL**: `/api/v1/exchange/rate/coingecko`
- **Method**: `POST`
- **Access**: Admin
- **Headers**: `Authorization: Bearer <admin_token>`
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Exchange rate updated successfully from CoinGecko",
    "data": {
      "rate": 84.75,
      "lastUpdated": "2025-09-02T18:15:00.000Z",
      "source": "CoinGecko"
    }
  }
  ```

### Get User Exchange Methods
- **URL**: `/api/v1/exchange/methods`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "methods": [
        {
          "_id": "68b73412376045ba9a16c475",
          "userId": "68b732d8376045ba9a16c434",
          "bankName": "Test Bank 1234567890",
          "accountNo": "ACC1234567890",
          "ifscCode": "IFSC1234567890",
          "accountName": "Test User",
          "createdAt": "2025-09-02T18:15:14.123Z",
          "updatedAt": "2025-09-02T18:15:14.123Z"
        }
      ]
    }
  }
  ```

### Add Exchange Method
- **URL**: `/api/v1/exchange/methods`
- **Method**: `POST`
- **Access**: User
- **Headers**: 
  - `Authorization: Bearer <user_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "bankName": "Test Bank",
    "accountNo": "ACC1234567890",
    "ifscCode": "IFSC1234567890",
    "accountName": "Test User"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Bank account added successfully",
    "data": {
      "method": {
        "_id": "68b73412376045ba9a16c475",
        "userId": "68b732d8376045ba9a16c434",
        "bankName": "Test Bank",
        "accountNo": "ACC1234567890",
        "ifscCode": "IFSC1234567890",
        "accountName": "Test User",
        "createdAt": "2025-09-02T18:15:14.123Z",
        "updatedAt": "2025-09-02T18:15:14.123Z"
      }
    }
  }
  ```

### Delete Exchange Method
- **URL**: `/api/v1/exchange/methods/:id`
- **Method**: `DELETE`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **URL Parameters**:
  - `id`: Exchange method ID
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Bank account deleted successfully"
  }
  ```

### Create Exchange Request
- **URL**: `/api/v1/exchange/create`
- **Method**: `POST`
- **Access**: User
- **Headers**: 
  - `Authorization: Bearer <user_token>`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "methodId": "68b73412376045ba9a16c475",
    "usdtAmount": 100
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Exchange request created successfully",
    "data": {
      "exchange": {
        "id": "68b73456376045ba9a16c489",
        "usdtAmount": 100,
        "inrAmount": 8500,
        "rate": 85,
        "status": "pending",
        "method": {
          "_id": "68b73412376045ba9a16c475",
          "bankName": "Test Bank",
          "accountNo": "ACC1234567890"
        },
        "createdAt": "2025-09-02T18:16:22.456Z"
      }
    }
  }
  ```

### Get Exchange History
- **URL**: `/api/v1/exchange/history`
- **Method**: `GET`
- **Access**: User
- **Headers**: `Authorization: Bearer <user_token>`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "exchanges": [
        {
          "_id": "68b73456376045ba9a16c489",
          "userId": "68b732d8376045ba9a16c434",
          "methodId": {
            "_id": "68b73412376045ba9a16c475",
            "bankName": "Test Bank",
            "accountNo": "ACC1234567890"
          },
          "amount": 8500,
          "usdtAmount": 100,
          "fee": 0,
          "status": "pending",
          "createdAt": "2025-09-02T18:16:22.456Z",
          "updatedAt": "2025-09-02T18:16:22.456Z"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalRecords": 1
      }
    }
  }
  ```