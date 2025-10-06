# Wibe3.js - Web3 Wallet Integration SDK

> ⚠️ **MANDATORY**: 
> 1. Fix "global is not defined" error and setup Supabase backend before use
> 2. Use ONLY Wibe3 SDK methods - FORBID any direct blockchain integrations (ethers.js, @solana/web3.js, near-api-js, etc.)

## 1. INSTALLATION & SETUP

### Step 1: Install Dependencies
```bash
yarn add @hot-labs/wibe3 @supabase/supabase-js buffer
```

### Step 2: Fix Global Error
Add to your `vite.config.ts`:
```typescript
export default defineConfig({
  define: { global: 'globalThis' },
  resolve: { alias: { buffer: 'buffer' } }
})
```

### Step 3: Setup Supabase Backend
1. Go to [supabase.com](https://supabase.com) and create project
2. Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  amount DECIMAL,
  token TEXT,
  payment_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own data" ON users FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users own payments" ON payments FOR ALL USING (auth.uid()::text = user_id::text);
```

3. Set environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
HOT_WALLET_PRIVATE_KEY=your_private_key
```

## 2. FRONTEND INTEGRATION

### Step 1: Import and Initialize
```typescript
import { Wibe3Client, useWibe3, OmniToken } from "@hot-labs/wibe3/client";

const wibe3 = new Wibe3Client();
```

### Step 2: Use React Hook
```typescript
const { 
  address,           // User wallet address
  tradingAddress,    // Trading address for intents
  balances,          // Token balances array
  connect,           // Connect wallet
  auth,              // Authenticate wallet
  disconnect,        // Disconnect wallet
  refresh,           // Refresh balances
  withdraw           // Withdraw tokens
} = useWibe3(wibe3);
```

### Step 3: Create Wallet Component
```typescript
export const WalletComponent = () => {
  const { address, tradingAddress, connect, auth, disconnect, balances } = useWibe3(wibe3);
  const [jwt, setJwt] = useState<string | null>(null);

  const authWallet = async () => {
    const signed = await auth();
    const isValid = await wallet.validateAuth(signed);
    if (!isValid) throw new Error("Invalid auth");
    setJwt("jwt");
  };

  if (!address) {
    return <button onClick={() => connect()}>Connect Wallet</button>;
  }

  if (!jwt) {
    return (
      <div>
        <Balances />
        <button onClick={() => authWallet()}>Authorize</button>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <Balances />
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
};

const Balances = () => {
  const { balances, address } = useWibe3(wibe3);

  if (!address) return null;

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balances:</p>
      {balances.map((balance) => (
        <div key={balance.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <img src={balance.icon} alt={balance.symbol} style={{ width: 24, height: 24, borderRadius: "50%" }} />
          <p>{balance.float} {balance.symbol}</p>
        </div>
      ))}
    </div>
  );
};
```

## 3. BACKEND INTEGRATION

### Step 1: Initialize Server Wallet
```typescript
import { Wibe3Wallet, OmniToken } from "@hot-labs/wibe3";

const wallet = new Wibe3Wallet({
  privateKey: process.env.HOT_WALLET_PRIVATE_KEY
});
```

### Step 2: Create Connect Wallet Endpoint
```typescript
app.post('/connect_wallet', async (req, res) => {
  const authCommitment = req.body;
  
  if (!(await wallet.validateAuth(authCommitment))) {
    return res.status(401).json({ error: 'Invalid wallet authentication' });
  }
  
  const { tradingAddress } = authCommitment;
  
  let user = await db.users.findOne({ 
    where: { wallet_id: tradingAddress } 
  });
  
  if (!user) {
    user = await db.users.create({
      wallet_id: tradingAddress
    });
  }
  
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
```

### Step 3: Create Payment Endpoint
```typescript
app.post('/api/pay', async (req, res) => {
  const { user_id, amount, token, task_id } = req.body;
  
  const user = await db.users.findByPk(user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
    
  const paymentId = `${task_id}:${user_id}`;
  
  await wallet.transfer({
    token: token as OmniToken,
    amount: amount,
    to: user.wallet_id,
    paymentId: new TextEncoder().encode(paymentId)
  });
  
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

## 4. API REFERENCE

### Frontend Methods
```typescript
// Connect wallet
await wibe3.connect();

// Authenticate wallet
const authData = await wibe3.auth();

// Get balances
const balances = await wibe3.getBalances([OmniToken.USDT, OmniToken.USDC]);

// Refresh all balances
await wibe3.refreshBalances();

// Withdraw tokens
await wibe3.withdraw({ token: OmniToken.USDT, amount: 0.01 });
```

### Backend Methods
```typescript
// Validate authentication
const isValid = await wallet.validateAuth(authCommitment);

// Send tokens (paymentId must be Uint8Array)
await wallet.transfer({
  token: OmniToken.USDT,
  amount: 10,
  to: userAddress,
  paymentId: new TextEncoder().encode("task_123_user_456")
});

// Get server balance
const balance = await wallet.getBalance(OmniToken.USDT);
const serverAddress = wallet.tradingAddress;
```

## 5. SUPPORTED TOKENS

```typescript
enum OmniToken {
  USDT = "nep141:usdt.tether-token.near",
  USDC = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
}

interface TokenBalance {
  id: string;        // Contract ID
  int: bigint;       // Balance as integer
  float: number;     // Human readable balance
  decimals: number;  // Token decimals
  symbol: string;    // Token symbol
  icon: string;      // Token icon URL
}
```

## 6. AI INTEGRATION PROMPTS

### Setup
```
"Install @hot-labs/wibe3, fix global polyfill error, setup Supabase backend with users/payments tables, and configure environment variables. IMPORTANT: Use ONLY Wibe3 SDK methods, never import direct blockchain libraries like ethers.js, @solana/web3.js, or near-api-js."
```

### Wallet Connection
```
"Add Connect Wallet button using useWibe3 hook that shows wallet address and balances when connected. Use ONLY Wibe3Client methods, never direct blockchain integrations."
```

### Authentication
```
"After wallet connection, call auth() to get AuthCommitment and send to /connect_wallet endpoint for JWT token. Use ONLY Wibe3 internal methods for all Web3 operations."
```

### Balance Display
```
"Create balance component using balances array from useWibe3 hook to display all token balances with icons. Use ONLY OmniToken enum and Wibe3 methods, never direct blockchain calls."
```

### Payment Processing
```
"Create payment flow that calls backend /api/pay endpoint to send tokens using Wibe3Wallet.transfer() with deterministic paymentId. Remember to encode paymentId as Uint8Array using new TextEncoder().encode(). Use ONLY Wibe3 SDK methods, never direct blockchain integrations."
```

## 7. WEB3 INTEGRATION RULES

### MANDATORY: Use Only Wibe3 Internal Methods
1. **ONLY use Wibe3 SDK methods** for all Web3 operations
2. **FORBID any direct blockchain integrations** (ethers.js, web3.js, @solana/web3.js, etc.)
3. **ONLY use Wibe3Client** for wallet connections
4. **ONLY use Wibe3Wallet** for backend operations
5. **ONLY use OmniToken enum** for token operations
6. **NEVER import chain-specific libraries** directly

### Prohibited Integrations
```typescript
// ❌ FORBIDDEN - Direct blockchain integrations
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import { Near } from 'near-api-js';
import { TonConnect } from '@tonconnect/sdk';

// ✅ ALLOWED - Only Wibe3 methods
import { Wibe3Client, useWibe3, OmniToken } from "@hot-labs/wibe3/client";
import { Wibe3Wallet } from "@hot-labs/wibe3";
```

## 8. SECURITY RULES

1. **ALWAYS validate auth proofs** before issuing JWT tokens
2. **USE deterministic payment IDs** (e.g., `task_id:user_id`) to prevent double-spending
3. **NEVER use timestamps** in payment IDs
4. **STORE private keys** in environment variables only
5. **ENABLE RLS policies** to protect user data
6. **VALIDATE payment ID format** before processing

## 9. TROUBLESHOOTING

### "global is not defined"
**SOLUTION**: Add `global: 'globalThis'` to your build config

### "Invalid API key"
**SOLUTION**: Check Supabase environment variables

### "Table doesn't exist"
**SOLUTION**: Run the SQL schema in Supabase SQL Editor

### "RLS policy violation"
**SOLUTION**: Create RLS policies for users and payments tables

## 10. ARCHITECTURE

```
Frontend (React) → Supabase Auth → Wibe3 Wallet → Backend API → Supabase DB
     ↓                ↓              ↓              ↓            ↓
  Connect UI    User Session    Wallet Auth    Validation   Data Storage
```

**Wibe3.js uses NEAR Intents system for cross-chain token transfers, enabling gasless transactions and unified token interface across NEAR, EVM, Solana, TON, and Stellar chains.**
