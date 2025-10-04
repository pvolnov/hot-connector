# Wibe3.js - Low-Level API Documentation for AI Integration

## Library Overview
- **Package**: `@hot-labs/wibe3`
- **Version**: 0.1.0
- **Type**: Non-custodial Web3 SDK
- **Chains**: NEAR, EVM (Ethereum, Base, BSC), Solana, TON, Stellar
- **Architecture**: Client SDK + Backend SDK
- **Installation**: `yarn add @hot-labs/wibe3`

## Core API Functions

### Client SDK Functions
```typescript
// Import and initialize client SDK
import { Wibe3Client } from "@hot-labs/wibe3";

// Initialize Wibe3Client
const wibe3 = await Wibe3Client.initialize({
  projectId: "your-project-id",
  name: "Your App",
  description: "Your App Description",
  url: "https://yourapp.com",
  icons: ["https://yourapp.com/icon.png"]
});

// Function: wibe3.connect()
// Purpose: Opens wallet connection modal
// Returns: Promise<void>
// Supported wallets: NEAR, EVM, Solana, TON, Stellar
await wibe3.connect();

// Function: wibe3.auth()
// Purpose: Generates signed proof for backend validation
// Returns: Promise<AuthCommitment>
// Usage: Send result to backend for JWT generation
const auth = await wibe3.auth();

// Function: wibe3.getBalance(token)
// Purpose: Gets token balance for connected wallet
// Parameters: OmniToken
// Returns: Promise<TokenBalance>
const balance = await wibe3.getBalance(OmniToken.USDT);

// Function: wibe3.isSignedIn()
// Purpose: Checks if wallet is connected
// Returns: Promise<boolean>
const isConnected = await wibe3.isSignedIn();

// Function: wibe3.disconnect()
// Purpose: Disconnects current wallet
// Returns: Promise<void>
await wibe3.disconnect();

// Function: wibe3.withdraw()
// Purpose: Initiates withdrawal from connected wallet
// Returns: Promise<void>
// Usage: Call after successful backend payment
await wibe3.withdraw();
```

### Backend SDK Functions
```typescript
// Import backend SDK
import { Wibe3Wallet, OmniToken } from "@hot-labs/wibe3";

// Initialize server wallet
const wibe3 = new Wibe3Wallet({
  privateKey: "YOUR_PRIVATE_KEY" // KeyPairString format
});

// Function: wibe3.validateAuth(authCommitment)
// Purpose: Validates signed proof from frontend
// Parameters: AuthCommitment
// Returns: Promise<boolean>
// Usage: Verify wallet ownership before issuing JWT
const isValid = await wibe3.validateAuth(authCommitment);

// Function: wibe3.transfer(params)
// Purpose: Sends tokens to address
// Parameters: { token: OmniToken, amount: number, to: string, paymentId: string }
// Returns: Promise<void>
// Usage: Send rewards/payments to users
await wibe3.transfer({
  token: OmniToken.USDT,
  amount: 10,
  to: userAddress,
  paymentId: "unique-payment-id"
});

// Function: wibe3.getBalance(token)
// Purpose: Gets token balance for server wallet
// Parameters: OmniToken
// Returns: Promise<TokenBalance>
const balance = await wibe3.getBalance(OmniToken.USDT);

// Property: wibe3.tradingAddress
// Purpose: Gets server wallet trading address
// Type: string
const serverAddress = wibe3.tradingAddress;
```

## Supported Tokens
```typescript
enum OmniToken {
  USDT = "nep141:wrap.near",
  USDC = "nep141:usdc.near"
}

// Token metadata
const OmniTokenMetadata = {
  [OmniToken.USDT]: { 
    decimals: 6, 
    symbol: "USDT", 
    contractId: "wrap.near" 
  },
  [OmniToken.USDC]: { 
    decimals: 6, 
    symbol: "USDC", 
    contractId: "usdc.near" 
  }
};

// Token balance interface
interface TokenBalance {
  id: string;        // Contract ID
  int: bigint;       // Balance as integer (with decimals)
  float: number;     // Balance as float (human readable)
  decimals: number;  // Token decimals
  symbol: string;    // Token symbol
}
```

## Use Case 1: Frontend + Supabase Architecture

### Architecture Overview
```
Frontend (React/Next.js) → Supabase (Database) → Backend (Node.js) → Blockchain
                         ↑
                    (Balance check is local)
```

### Implementation Flow

#### Frontend Implementation
```typescript
import { Wibe3Client, useWibe3, OmniToken } from "@hot-labs/wibe3/client";
import { useState, useEffect } from "react";

const wibe3 = new Wibe3Client();

const Wibe3App = () => {
  const { address, connect, auth } = useWibe3(wibe3);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [balance, setBalance] = useState(null);

  // 1. User login and wallet connection
  const handleLogin = async () => {
    await wibe3.connect();
    const authData = await wibe3.auth();
    
    // Send auth to backend for JWT
    const response = await fetch('/connect_wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authData)
    });
    const { jwt, wallet_id } = await response.json();
    
    // Store JWT locally
    localStorage.setItem('jwt', jwt);
    setIsAuthorized(true);
  };

  // 2. Check balance (works locally, no backend call needed)
  const checkBalance = async () => {
    // Get balance directly from connected wallet - no API call required
    const balance = await wibe3.getBalance(OmniToken.USDT);
    setBalance(balance);
    return balance;
  };

  // 3. Check if wallet is connected
  const isWalletConnected = async () => {
    return await wibe3.isSignedIn();
  };

  // 4. Withdraw funds
  const handleWithdraw = async () => {
    await wibe3.withdraw();
  };

  // 5. Disconnect wallet
  const handleDisconnect = async () => {
    await wibe3.disconnect();
    localStorage.removeItem('jwt');
    setIsAuthorized(false);
    setBalance(null);
  };
};
```

#### Database Schema
```sql
-- Users table with wallet mapping (only user_id:wallet_id)
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  amount DECIMAL,
  token TEXT,
  payment_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_users_wallet_id ON users(wallet_id);
CREATE INDEX idx_payments_payment_id ON payments(payment_id);
```

#### Backend Implementation
```typescript
import { Wibe3Wallet, OmniToken } from "@hot-labs/wibe3";

// Initialize server wallet
const wibe3 = new Wibe3Wallet({
  privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});

// Connect wallet endpoint
app.post('/connect_wallet', async (req, res) => {
  const authCommitment = req.body;
  
  if (!(await wibe3.validateAuth(authCommitment))) {
    return res.status(401).json({ error: 'Invalid wallet authentication' });
  }
  
  const { tradingAddress } = authCommitment;
  
  // Check if user already exists
  let user = await db.users.findOne({ 
    where: { wallet_id: tradingAddress } 
  });
  
  if (!user) {
    // Create new user with only user_id:wallet_id mapping
    user = await db.users.create({
      wallet_id: tradingAddress
    });
  }
  
  // Generate JWT token
  const jwt = generateJWT({
    userId: user.user_id,
    walletId: user.wallet_id
  });
  
  res.json({ 
    success: true, 
    jwt: jwt,
    wallet_id: user.wallet_id,
    user_id: user.user_id
  });
});

// Payment endpoint
app.post('/api/pay', async (req, res) => {
  const { user_id, amount, token, task_id } = req.body;
  
  // Get user wallet from database
  const user = await db.users.findByPk(user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
    
  const paymentId = `${task_id}:${user.user_id}`;
  
  // Send payment using intents
  await wibe3.transfer({
    token: token as OmniToken,
    amount: amount,
    to: user.wallet_id,
    paymentId: paymentId
  });
  
  // Store payment record
  await db.payments.create({
    user_id,
    amount,
    token,
    payment_id: paymentId,
    status: 'completed'
  });
    
  res.json({ success: true });
});

```

## Use Case 2: Frontend + Backend Payment Verification

### Architecture Overview
```
Frontend (React/Next.js) → Backend (Node.js) → Blockchain → Database
                         ↑
                    (Balance check is local)
```

### Implementation Flow

#### Frontend Implementation
```typescript
import { Wibe3Client, OmniToken } from "@hot-labs/wibe3";

// Initialize Wibe3Client
const wibe3 = await Wibe3Client.initialize({
  projectId: "your-project-id",
  name: "Your App",
  description: "Your App Description",
  url: "https://yourapp.com", 
  icons: ["https://yourapp.com/icon.png"]
});

// 1. User login and wallet connection
const handleLogin = async () => {
  await wibe3.connect();
  const auth = await wibe3.auth();
  
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auth)
  });
  const { jwt } = await response.json();
  
  localStorage.setItem('jwt', jwt);
};

// 2. Check balance (works locally, no backend call needed)
const checkBalance = async () => {
  // Get balance directly from connected wallet - no API call required
  const balance = await wibe3.getBalance(OmniToken.USDT);
  return balance;
};

// 3. Deposit funds
const handleDeposit = async () => {
  await wibe3.withdraw(); // User sends to our wallet
};

// 4. Pay for service
const handlePayment = async (amount: number, token: OmniToken, taskId: string) => {
  const jwt = localStorage.getItem('jwt');
  
  const response = await fetch('/api/pay', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount, token, task_id: taskId })
  });
  
  const { success } = await response.json();
  
  if (success) {
    showSuccess('Payment successful!');
  }
};
```

#### Backend Implementation
```typescript
import { Wibe3Wallet, OmniToken } from "@hot-labs/wibe3";

// Initialize server wallet
const wibe3 = new Wibe3Wallet({
  privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});

// Payment endpoint
app.post('/api/pay', async (req, res) => {
  const { amount, token, task_id } = req.body;
  const user = getUserFromJWT(req.headers.authorization);
  
  // Generate payment request
  const paymentId = `${task_id}:${user.id}`;
  
  // Send payment using intents
  await wibe3.transfer({
    token: token as OmniToken,
    amount: amount,
    to: user.tradingAddress,
    paymentId: paymentId
  });
  
  // Store payment record
  await db.payments.create({
    user_id: user.id,
    amount,
    token,
    payment_id: paymentId,
    status: 'completed'
  });
  
  res.json({ 
    success: true,
    message: 'Payment sent successfully!'
  });
});

```

## AI Integration Prompts

### For Wallet Connection
```
"Add a Connect Wallet button that initializes Wibe3Client and calls wibe3.connect() to open wallet selection modal"
```

### For Authentication
```
"After wallet connection, call wibe3.auth() to get AuthCommitment and send it to /api/auth endpoint to get JWT token"
```

### For Balance Display
```
"Create a balance component that calls wibe3.getBalance(token) to display user's token balance directly from connected wallet - no backend API needed"
```

### For Payment Processing
```
"When user clicks pay button, call backend /api/pay endpoint to send tokens using wibe3.transfer() with intents system"
```

### For Reward System
```
"After user completes task, call backend /api/reward endpoint to send tokens using wibe3.transfer() with unique paymentId"
```

### For Wallet Status
```
"Add wallet connection status indicator using wibe3.isSignedIn() to show if user is connected"
```

### For Disconnection
```
"Add disconnect functionality using wibe3.disconnect() to allow users to switch wallets"
```

## Security Best Practices

1. **Always validate auth proofs** before issuing JWT tokens
2. **Use deterministic payment IDs** to prevent double-spending (e.g., `task_id:user_id`)
3. **Never use timestamps** in payment IDs to avoid race conditions
4. **Store JWT in httpOnly cookies** or secure storage
5. **Never expose private keys** in frontend code
6. **Store backend private keys in secure environment variables** (e.g., `HOT_WALLET_PRIVATE_KEY`)
7. **Verify transactions** on-chain before marking as complete
8. **Use rate limiting** on payment endpoints
9. **Implement proper error handling** for failed transactions

## 🚨 CRITICAL VULNERABILITIES TO AVOID

### 1. Payment ID Double Spending Attack
**CRITICAL**: Using non-deterministic payment IDs can lead to financial losses

#### ❌ VULNERABLE CODE:
```typescript
// NEVER DO THIS - Allows double spending!
const paymentId = `${user_id}-${Date.now()}`;
const paymentId = `${user_id}-${Math.random()}`;
const paymentId = `${user_id}-${crypto.randomUUID()}`;
```

#### ⚠️ Attack Scenario:
1. User creates payment request with `user123-1703123456789`
2. User quickly creates another request with `user123-1703123456790`
3. Both payments go through, user gets paid twice for same task
4. **Result**: Financial loss, broken business logic

#### ✅ SECURE CODE:
```typescript
// ALWAYS use deterministic IDs based on business logic
const paymentId = `${task_id}:${user_id}`;
const paymentId = `service_${service_id}_${user_id}`;
const paymentId = `reward_${achievement_id}_${user_id}`;
```

### 2. Race Condition in Payment Processing
**CRITICAL**: Concurrent requests can bypass payment validation

#### ❌ VULNERABLE CODE:
```typescript
// Check if payment exists
const existingPayment = await db.payments.findByPaymentId(paymentId);
if (existingPayment) {
  return res.status(400).json({ error: 'Payment already exists' });
}

// Create payment (RACE CONDITION HERE!)
await db.payments.create({ paymentId, amount, userId });
await wibe3.transfer({ paymentId, amount, to: userAddress });
```

#### ✅ SECURE CODE:
```typescript
// Use database constraints and transactions
await db.transaction(async (tx) => {
  const existingPayment = await tx.payments.findByPaymentId(paymentId);
  if (existingPayment) {
    throw new Error('Payment already exists');
  }
  
  await tx.payments.create({ paymentId, amount, userId });
  await wibe3.transfer({ paymentId, amount, to: userAddress });
});
```

### 3. Insufficient Payment ID Validation
**CRITICAL**: Malicious payment IDs can break system integrity

#### ❌ VULNERABLE CODE:
```typescript
// No validation - allows any string
const paymentId = req.body.paymentId;
```

#### ✅ SECURE CODE:
```typescript
// Validate payment ID format
const paymentIdPattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/;
if (!paymentIdPattern.test(paymentId)) {
  return res.status(400).json({ error: 'Invalid payment ID format' });
}

// Validate business logic
const [taskId, userId] = paymentId.split(':');
if (!await isValidTaskId(taskId) || !await isValidUserId(userId)) {
  return res.status(400).json({ error: 'Invalid task or user' });
}
```

## 🛡️ BEST PRACTICES FOR PAYMENT SECURITY

### 1. Payment ID Design Principles
```typescript
// ✅ GOOD: Deterministic and business-logic based
const paymentId = `${task_id}:${user_id}`;
const paymentId = `subscription_${plan_id}_${user_id}_${billing_cycle}`;

// ✅ GOOD: Include context to prevent confusion
const paymentId = `reward_${achievement_id}_${user_id}_${timestamp}`;
const paymentId = `refund_${original_payment_id}_${user_id}`;

// ❌ BAD: Non-deterministic
const paymentId = `${user_id}-${Date.now()}`;
const paymentId = `${user_id}-${Math.random()}`;
```

### 2. Database Constraints
```sql
-- Ensure payment ID uniqueness
ALTER TABLE payments ADD CONSTRAINT unique_payment_id UNIQUE (payment_id);

-- Add check constraints
ALTER TABLE payments ADD CONSTRAINT valid_payment_id_format 
CHECK (payment_id ~ '^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$');
```

### 3. Idempotency Implementation
```typescript
// Handle duplicate payment requests gracefully
app.post('/api/pay', async (req, res) => {
  const { task_id, user_id, amount, token } = req.body;
  const paymentId = `${task_id}:${user_id}`;
  
  try {
    // Check if payment already exists
    const existingPayment = await db.payments.findByPaymentId(paymentId);
    if (existingPayment) {
      return res.json({ 
        success: true, 
        message: 'Payment already processed',
        paymentId: existingPayment.payment_id 
      });
    }
    
    // Process new payment
    await processPayment(paymentId, amount, token, user_id);
    res.json({ success: true, paymentId });
    
  } catch (error) {
    if (error.code === 'DUPLICATE_PAYMENT') {
      return res.json({ success: true, message: 'Payment already processed' });
    }
    throw error;
  }
});
```

### 4. Audit Trail Requirements
```typescript
// Always log payment attempts
const logPaymentAttempt = async (paymentId, userId, amount, status) => {
  await db.payment_logs.create({
    payment_id: paymentId,
    user_id: userId,
    amount: amount,
    status: status, // 'attempted', 'success', 'failed', 'duplicate'
    timestamp: new Date(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });
};
```

### 5. Rate Limiting for Payment Endpoints
```typescript
// Prevent rapid-fire payment requests
const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 payments per minute per IP
  message: 'Too many payment requests, please try again later'
});

app.post('/api/pay', paymentRateLimit, async (req, res) => {
  // Payment logic here
});
```

## Error Handling Patterns

```typescript
// Client-side error handling
try {
  await wibe3.connect();
} catch (error) {
  if (error.message === 'User rejected') {
    showMessage('Wallet connection cancelled');
  } else if (error.message === 'No wallet connected') {
    showMessage('Please connect a wallet first');
  } else {
    showMessage('Connection failed: ' + error.message);
  }
}

// Auth error handling
try {
  const auth = await wibe3.auth();
} catch (error) {
  if (error.message === 'No wallet connected') {
    showMessage('Please connect a wallet first');
  } else {
    showMessage('Authentication failed: ' + error.message);
  }
}

// Balance error handling
try {
  const balance = await wibe3.getBalance(OmniToken.USDT);
} catch (error) {
  if (error.message === 'No wallet connected') {
    showMessage('Please connect a wallet first');
  } else {
    showMessage('Failed to get balance: ' + error.message);
  }
}

// Backend error handling
try {
  await wibe3.transfer(params);
} catch (error) {
  if (error.message.includes('insufficient')) {
    return res.status(400).json({ error: 'Insufficient funds' });
  } else if (error.message.includes('invalid')) {
    return res.status(400).json({ error: 'Invalid transfer parameters' });
  }
  throw error;
}

// Auth validation error handling
try {
  const isValid = await wibe3.validateAuth(authCommitment);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid authentication' });
  }
} catch (error) {
  return res.status(500).json({ error: 'Auth validation failed' });
}
```

## Testing Patterns

```typescript
// Mock Wibe3Client for testing
const mockWibe3Client = {
  connect: jest.fn().mockResolvedValue(undefined),
  auth: jest.fn().mockResolvedValue({ 
    tradingAddress: 'test-address',
    signed: {},
    address: 'test-address',
    publicKey: 'test-public-key',
    chainId: 'NEAR',
    seed: 'test-seed'
  }),
  getBalance: jest.fn().mockResolvedValue({
    id: 'wrap.near',
    int: 1000000n,
    float: 1.0,
    decimals: 6,
    symbol: 'USDT'
  }),
  isSignedIn: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(undefined),
  withdraw: jest.fn().mockResolvedValue(undefined)
};

// Mock Wibe3Wallet for backend testing
const mockWibe3Wallet = {
  validateAuth: jest.fn().mockResolvedValue(true),
  transfer: jest.fn().mockResolvedValue(undefined),
  getBalance: jest.fn().mockResolvedValue({
    id: 'wrap.near',
    int: 1000000n,
    float: 1.0,
    decimals: 6,
    symbol: 'USDT'
  }),
  tradingAddress: 'test-server-address'
};

// Test wallet connection
test('should connect wallet', async () => {
  await handleLogin();
  expect(mockWibe3Client.connect).toHaveBeenCalled();
});

// Test authentication
test('should authenticate user', async () => {
  const auth = await mockWibe3Client.auth();
  expect(auth.tradingAddress).toBe('test-address');
});

// Test balance retrieval
test('should get token balance', async () => {
  const balance = await mockWibe3Client.getBalance(OmniToken.USDT);
  expect(balance.symbol).toBe('USDT');
  expect(balance.float).toBe(1.0);
});

// Test backend transfer
test('should transfer tokens', async () => {
  await mockWibe3Wallet.transfer({
    token: OmniToken.USDT,
    amount: 10,
    to: 'user-address',
    paymentId: 'test-payment-id'
  });
  expect(mockWibe3Wallet.transfer).toHaveBeenCalledWith({
    token: OmniToken.USDT,
    amount: 10,
    to: 'user-address',
    paymentId: 'test-payment-id'
  });
});
```

## React Hook Integration

### Using useWibe3 Hook
```typescript
import { Wibe3Client, useWibe3 } from "@hot-labs/wibe3/client";
import { useState, useEffect } from "react";

const wibe3 = new Wibe3Client();

const Wibe3App = () => {
  const { address, connect, auth } = useWibe3(wibe3);
  const [jwt, setJwt] = useState<string | null>(null);
  const [balance, setBalance] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if user is already authorized
  useEffect(() => {
    const storedJwt = localStorage.getItem('jwt');
    if (storedJwt) {
      setJwt(storedJwt);
      setIsAuthorized(true);
    }
  }, []);

  // Get wallet balance
  const getBalance = async () => {
    if (!address) return;
    try {
      const balance = await wibe3.getBalance(OmniToken.USDT);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  // Authenticate user
  const authUser = async () => {
    try {
      const authData = await wibe3.auth();
      const response = await fetch("/connect_wallet", { 
        body: JSON.stringify(authData), 
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const { jwt: token } = await response.json();
        setJwt(token);
        setIsAuthorized(true);
        localStorage.setItem('jwt', token);
        await getBalance(); // Refresh balance after auth
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    await wibe3.disconnect();
    setJwt(null);
    setIsAuthorized(false);
    setBalance(null);
    localStorage.removeItem('jwt');
  };

  // Refresh balance
  useEffect(() => {
    if (isAuthorized && address) {
      getBalance();
    }
  }, [isAuthorized, address]);

  if (!address) {
    return (
      <div className="wallet-connect">
        <h3>Connect Your Wallet</h3>
        <button onClick={() => connect()}>Connect Wallet</button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="wallet-auth">
        <h3>Wallet Connected</h3>
        <p>Address: {address}</p>
        <button onClick={() => authUser()}>Authorize Wallet</button>
      </div>
    );
  }

  return (
    <div className="wallet-authorized">
      <h3>Wallet Authorized</h3>
      <p>Address: {address}</p>
      
      {balance && (
        <div className="balance">
          <h4>Balance</h4>
          <p>{balance.float} {balance.symbol}</p>
        </div>
      )}
      
      <button onClick={() => getBalance()}>Refresh Balance</button>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
};
```

## Wibe3 Integration Guide

### Step 1: Frontend Integration

#### 1.1 Add Wallet Connection Button and Status
```typescript
import { Wibe3Client, useWibe3 } from "@hot-labs/wibe3/client";
import { useState, useEffect } from "react";

const wibe3 = new Wibe3Client();

const WalletComponent = () => {
  const { address, connect, auth } = useWibe3(wibe3);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [balance, setBalance] = useState(null);

  // Check authorization status
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    setIsAuthorized(!!jwt);
  }, []);

  // Get wallet balance
  const getBalance = async () => {
    if (!address) return;
    try {
      const balance = await wibe3.getBalance(OmniToken.USDT);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  return (
    <div className="wallet-integration">
      {!address ? (
        <button onClick={() => connect()}>Connect Wallet</button>
      ) : !isAuthorized ? (
        <button onClick={() => authUser()}>Authorize Wallet</button>
      ) : (
        <div>
          <p>✅ Wallet Connected & Authorized</p>
          <p>Address: {address}</p>
        </div>
      )}
    </div>
  );
};
```

#### 1.2 Add Balance Display
```typescript
const BalanceDisplay = () => {
  const [balance, setBalance] = useState(null);

  const refreshBalance = async () => {
    try {
      const balance = await wibe3.getBalance(OmniToken.USDT);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  return (
    <div className="balance-display">
      <h3>Wallet Balance</h3>
      {balance ? (
        <div>
          <p>{balance.float} {balance.symbol}</p>
          <button onClick={refreshBalance}>Refresh</button>
        </div>
      ) : (
        <p>Connect wallet to view balance</p>
      )}
    </div>
  );
};
```

### Step 2: Backend Integration

#### 2.1 Create User-Wallet Mapping Table
```sql
-- Create users table with wallet mapping (only user_id:wallet_id)
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_wallet_id ON users(wallet_id);
```

#### 2.2 Implement /connect_wallet Endpoint
```typescript
import { Wibe3Wallet } from "@hot-labs/wibe3";

const wibe3 = new Wibe3Wallet({
  privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});

// Connect wallet endpoint
app.post('/connect_wallet', async (req, res) => {
  try {
    const authCommitment = req.body;
    
    // Validate auth commitment
    if (!(await wibe3.validateAuth(authCommitment))) {
      return res.status(401).json({ error: 'Invalid wallet authentication' });
    }
    
    const { tradingAddress } = authCommitment;
    
    // Check if user already exists
    let user = await db.users.findOne({ 
      where: { wallet_id: tradingAddress } 
    });
    
    if (!user) {
      // Create new user with only user_id:wallet_id mapping
      user = await db.users.create({
        wallet_id: tradingAddress
      });
    }
    
    // Generate JWT token
    const jwt = generateJWT({
      userId: user.user_id,
      walletId: user.wallet_id
    });
    
    res.json({ 
      success: true, 
      jwt: jwt,
      wallet_id: user.wallet_id,
      user_id: user.user_id
    });
    
  } catch (error) {
    console.error('Wallet connection failed:', error);
    res.status(500).json({ error: 'Wallet connection failed' });
  }
});
```

#### 2.3 JWT Middleware for Protected Routes
```typescript
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.users.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected route example
app.get('/api/user/profile', authenticateUser, (req, res) => {
  res.json({
    user_id: req.user.user_id,
    wallet_id: req.user.wallet_id
  });
});
```

### Step 3: Complete Integration Example

#### Frontend Complete Component
```typescript
import { Wibe3Client, useWibe3, OmniToken } from "@hot-labs/wibe3/client";
import { useState, useEffect } from "react";

const wibe3 = new Wibe3Client();

const Wibe3Integration = () => {
  const { address, connect, auth } = useWibe3(wibe3);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [balance, setBalance] = useState(null);
  const [user, setUser] = useState(null);

  // Check if user is already authorized
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      setIsAuthorized(true);
      fetchUserProfile(jwt);
    }
  }, []);

  // Get user profile
  const fetchUserProfile = async (jwt) => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Connect and authorize wallet
  const connectAndAuth = async () => {
    try {
      await connect();
      const authData = await auth();
      
      const response = await fetch('/connect_wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      
      if (response.ok) {
        const { jwt } = await response.json();
        localStorage.setItem('jwt', jwt);
        setIsAuthorized(true);
        await fetchUserProfile(jwt);
        await getBalance();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // Get wallet balance
  const getBalance = async () => {
    if (!address) return;
    try {
      const balance = await wibe3.getBalance(OmniToken.USDT);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  // Disconnect
  const disconnect = async () => {
    await wibe3.disconnect();
    localStorage.removeItem('jwt');
    setIsAuthorized(false);
    setBalance(null);
    setUser(null);
  };

  return (
    <div className="wibe3-integration">
      <h2>Wibe3 Wallet Integration</h2>
      
      {!address ? (
        <div className="connect-section">
          <button onClick={connectAndAuth}>Connect Wallet</button>
        </div>
      ) : !isAuthorized ? (
        <div className="auth-section">
          <p>Wallet Connected: {address}</p>
          <button onClick={connectAndAuth}>Authorize Wallet</button>
        </div>
      ) : (
        <div className="authorized-section">
          <h3>✅ Wallet Connected & Authorized</h3>
          <p>Address: {address}</p>
          
          {user && (
            <div className="user-info">
              <p>User ID: {user.user_id}</p>
              <p>Wallet ID: {user.wallet_id}</p>
            </div>
          )}
          
          {balance && (
            <div className="balance-section">
              <h4>Balance</h4>
              <p>{balance.float} {balance.symbol}</p>
              <button onClick={getBalance}>Refresh Balance</button>
            </div>
          )}
          
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
};
```

## Environment Variables

### Backend Environment Setup
```bash
# .env file for backend
HOT_WALLET_PRIVATE_KEY=your_private_key_here
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=your_database_url
```

## Type Definitions

### AuthCommitment Interface
```typescript
interface AuthCommitment {
  tradingAddress: string;  // User's trading address
  signed: Record<string, any>;  // Signed data from wallet
  address: string;  // Wallet address
  publicKey: string;  // Wallet public key
  chainId: WalletType;  // Chain type (NEAR, EVM, SOLANA, TON, STELLAR)
  seed: string;  // Wallet seed
}
```

### TransferIntent Interface
```typescript
interface TrasferIntent {
  intent: "transfer";
  tokens: Record<string, string>;  // Token amounts as strings
  receiver_id: string;  // Receiver address
}
```

### WalletType Enum
```typescript
enum WalletType {
  NEAR = "NEAR",
  EVM = "EVM", 
  SOLANA = "SOLANA",
  TON = "TON",
  STELLAR = "STELLAR"
}
```

## Dependencies

The library depends on the following packages:
- `@hot-labs/near-connect` - Core wallet connector
- `@reown/appkit` - EVM wallet integration
- `@reown/appkit-adapter-ethers` - Ethereum adapter
- `@reown/appkit-adapter-solana` - Solana adapter
- `@tonconnect/ui` - TON wallet integration
- `@creit.tech/stellar-wallets-kit` - Stellar wallet integration
- `@near-js/crypto` - NEAR cryptography
- `@near-js/utils` - NEAR utilities

## Configuration

### Client Configuration
```typescript
interface WibeClientOptions {
  projectId: string;      // Reown project ID
  name: string;          // App name
  description: string;   // App description
  url: string;          // App URL
  icons: string[];      // App icons
}
```

### Default Configuration
```typescript
const initialConfig = {
  projectId: "4eb7f418478b6a57b97d8d587e69801d",
  name: "Wibe3",
  description: "Wibe3",
  url: "https://wibe.io",
  icons: ["https://wibe.io/favicon.ico"]
};
```

## Intents System

Wibe3 uses the NEAR Intents system for cross-chain token transfers. This allows:
- Gasless transactions
- Cross-chain compatibility
- Unified token interface
- Secure transaction signing

### How Intents Work
1. User signs an intent with their wallet
2. Intent is published to relayer (third party)
3. Relayer triger smart ocntract with omni balance and executes Intent
4. Tokens are transferred to target address
5. Transaction is recorded on blockchain

